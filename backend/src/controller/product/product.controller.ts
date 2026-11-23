import { Request, Response } from "express";
import { and, eq, sql } from "drizzle-orm";
import crypto from "node:crypto";

import { db } from "../../config/db";
import { products, sales } from "../../config/schema";
import {
  createProductSchema,
  editProductSchema,
} from "../../validation/product.vlidation";
import { AuthRequest } from "../../middleware/users.middleware";
import { uploadProductPhoto } from "../../utils/cloudinaryUpload";
import { salesSchema } from "../../validation/sales.validation";
import { invoice } from "../../config/schema";
import { string, ZodError } from "zod";

const invoiceNumber = (): string => {
  return crypto.randomInt(100000, 1000000).toString();
};

export class Product {
  createProduct = async (req: AuthRequest, res: Response) => {
    let uploadedPublicId: string | undefined;
    try {
      const isOwner = req.user?.role;

      const validation = createProductSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Data produk tidak valid",
          errors: validation.error.flatten().fieldErrors,
        });
      }

      const data = validation.data;

      const barcode = data.barcode?.trim() || null;

      // 2. Cek barcode duplikat
      if (barcode) {
        const [existingProduct] = await db
          .select({ id: products.id })
          .from(products)
          .where(eq(products.barcode, barcode))
          .limit(1);

        if (existingProduct) {
          return res.status(409).json({
            success: false,
            message: "Barcode sudah digunakan",
          });
        }
      }

      // 3. Upload foto ke Cloudinary jika ada
      let imageUrl: string | null = null;

      if (req.file) {
        const uploaded = await uploadProductPhoto(req.file.buffer);

        imageUrl = uploaded.secure_url;
        uploadedPublicId = uploaded.public_id;
      }

      // 4. Insert produk
      const [newProduct] = await db
        .insert(products)
        .values({
          name: data.name,
          description: data.description ?? null,
          barcode,
          sku: sql`'SKU-' || LPAD(nextval('products_id_seq')::text, 4, '0')`,
          price: data.price.toFixed(2),
          stock: data.stock,
          imageUrl,
        })
        .returning();

      return res.status(201).json({
        success: true,
        message: "Produk berhasil ditambahkan",
        data: newProduct,
      });
    } catch (error: any) {
      console.error("CREATE PRODUCT ERROR:", error);

      const dbError = error?.cause ?? error;

      if (dbError?.code === "23505") {
        return res.status(409).json({
          success: false,
          message: "Barcode atau SKU sudah digunakan",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Gagal menambahkan produk",
      });
    }
  };

  getAllProduct = async (req: AuthRequest, res: Response) => {
    try {
      const product = await db
        .select()
        .from(products)
        .where(eq(products.isActive, true));
      if (product.length === 0) {
        return res.status(404).json({
          success: false,
          message: "produk tidak tersedia",
        });
      }

      return res.status(200).json({
        success: true,
        message: "berhasil ambil data",
        data: product,
      });
    } catch (error) {}
  };

  editProduct = async (req: AuthRequest, res: Response) => {
    try {
      console.log("tes");

      const productId = Number(req.params.id);

      if (!Number.isInteger(productId) || productId <= 0) {
        return res.status(400).json({
          success: false,
          message: "ID produk tidak valid",
        });
      }

      const [searchProduct] = await db
        .select()
        .from(products)
        .where(eq(products.id, productId));

      if (!searchProduct) {
        return res.status(404).json({
          success: false,
          message: "Produk tidak ditemukan",
        });
      }

      // Validasi body hanya jika ada data yang dikirim
      const hasBody = Object.keys(req.body || {}).length > 0;
      const hasImage = Boolean(req.file);

      if (!hasBody && !hasImage) {
        return res.status(400).json({
          success: false,
          message: "Minimal ubah satu atribut produk",
        });
      }

      const validation = editProductSchema.safeParse(req.body);

      if (!validation.success) {
        // Log ke terminal backend untuk mempermudah debugging
        console.error("VALIDATION ERROR:", validation.error.format());

        return res.status(400).json({
          success: false,
          message: "Validasi gagal",
          errors: {
            ...validation.error.flatten().fieldErrors,
            ...(validation.error.flatten().formErrors.length > 0 && {
              _form: validation.error.flatten().formErrors,
            }),
          },
        });
      }

      const validatedData = validation.data;

      const updatedData: Record<string, any> = {
        ...validatedData,
        updatedAt: new Date(),
      };

      // Upload gambar jika ada file baru
      if (req.file) {
        const uploaded = await uploadProductPhoto(req.file.buffer);
        updatedData.imageUrl = uploaded.secure_url;
      }

      const [updatedProduct] = await db
        .update(products)
        .set(updatedData)
        .where(eq(products.id, productId))
        .returning();

      return res.status(200).json({
        success: true,
        message: "Produk berhasil diperbarui",
        data: updatedProduct,
      });
    } catch (error) {
      console.error("EDIT PRODUCT ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
      });
    }
  };

  saleProduct = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user!;

      const salesItems = salesSchema.parse(req.body);
      const { items, paymentMethod, paidAmount, status } = salesItems;

      if (!items || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Keranjang kosong",
        });
      }

      let total = 0;
      let totalQuantity = 0;

      const invoiceItems = [];

      // 1. Ambil produk dan hitung total
      for (const item of items) {
        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.barcode, item.barcode))
          .limit(1);

        if (!product) {
          return res.status(404).json({
            success: false,
            message: `Produk ${item.barcode} tidak ditemukan`,
          });
        }

        if (!product.isActive) {
          return res.status(400).json({
            success: false,
            message: `${product.name} tidak aktif`,
          });
        }

        if (product.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Stok ${product.name} tidak mencukupi`,
          });
        }

        const price = Number(product.price);
        const subtotal = price * item.quantity;

        total += subtotal;
        totalQuantity += item.quantity;

        invoiceItems.push({
          productId: product.id,
          productName: product.name,
          barcode: product.barcode,
          quantity: item.quantity,
          price: String(price),
          subtotal: String(subtotal),
        });
      }

      // 2. Validasi pembayaran
      if (paidAmount < total) {
        return res.status(400).json({
          success: false,
          message: "Uang pembayaran tidak mencukupi",
          total,
          paidAmount,
        });
      }

      const changeAmount = paidAmount - total;

      // 3. Generate invoice number
      const invoiceNumber = `INV-${crypto.randomUUID()}`;

      // 4. Insert transaksi utama (hanya SATU kali)
      const [newSale] = await db
        .insert(sales)
        .values({
          cashierId: user.userId,
          invoiceNumber,
          subtotal: String(total),
          total: String(total),
          paidAmount: String(paidAmount),
          changeAmount: String(changeAmount),
          paymentMethod,
          status: status,
        })
        .returning();

      // 5. Insert semua detail produk
      await db.insert(invoice).values(
        invoiceItems.map((item) => ({
          saleId: newSale.id,
          ...item,
        })),
      );

      // 6. Kurangi stok produk
      for (const item of items) {
        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.barcode, item.barcode));
        await db
          .update(products)
          .set({
            stock: sql`${products.stock} - ${item.quantity}`,
          })
          .where(eq(products.id, product.id));
      }

      // 7. Response
      return res.status(201).json({
        success: true,
        message: "Transaksi berhasil",
        data: {
          invoiceNumber,
          totalQuantity,
          subtotal: total,
          total,
          paidAmount,
          changeAmount,
          paymentMethod,
          items: invoiceItems,
          sale: newSale,
        },
      });
    } catch (error: any) {
      const dbError = error?.cause ?? error;

      if (dbError?.code === "23505") {
        return res.status(409).json({
          success: false,
          message: "Nomor invoice sudah digunakan",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  // scaner = async (req: AuthRequest, res: Response) => {
  //   try {
  //     const validation = scaner.parse(req.body);
  //     const { barcode } = validation;
  //     const [search] = await db
  //       .select()
  //       .from(products)
  //       .where(and(eq(products.barcode, barcode), eq(products.isActive, true)));

  //     const name = search.name;
  //     const sku = search.sku;

  //     if (!search) {
  //       return res.status(404).json({
  //         success: false,
  //         message: `barang dengan sku : ${sku} & name : ${name} tidak ditemukan`,
  //       });
  //     }

  //     return res.status(200).json({
  //       success: true,
  //       message: "data berhasil diambil",
  //       data: {
  //         id: search.id,
  //         product: search.name,
  //         SKU: search.sku,
  //         price: search.price,
  //         stock: search.stock,
  //         img: search.imageUrl,
  //       },
  //     });
  //   } catch (error: any) {
  //     const dbError = error?.cause ?? error;

  //     if (dbError?.code === "23505") {
  //       return res.status(409).json({
  //         success: false,
  //         message: "Nomor invoice sudah digunakan",
  //       });
  //     }

  //     return res.status(500).json({
  //       success: false,
  //       message: "Internal server error",
  //     });
  //   }
  // };
  getProductByBarcode = async (req: Request, res: Response) => {
    try {
      const { barcode } = req.params;

      if (!barcode || String(barcode).trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Barcode wajib diisi",
        });
      }

      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.barcode, String(barcode)))
        .limit(1);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Produk tidak ditemukan",
        });
      }

      if (!product.isActive) {
        return res.status(400).json({
          success: false,
          message: "Produk sudah tidak aktif",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Produk berhasil ditemukan",
        data: product,
      });
    } catch (error) {
      console.error("Get Product By Barcode Error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  getInvoice = async (req: Request, res: Response) => {
    try {
      const { invoiceNumber } = req.params;

      // Cari transaksi berdasarkan nomor invoice
      const [searchInvoice] = await db
        .select()
        .from(sales)
        .where(eq(sales.invoiceNumber, String(invoiceNumber)));

      if (!searchInvoice) {
        return res.status(404).json({
          success: false,
          message: "Invoice tidak ditemukan",
        });
      }

      // Pastikan transaksi sudah selesai
      if (searchInvoice.status !== "selesai") {
        return res.status(400).json({
          success: false,
          message: "Transaksi belum selesai",
        });
      }

      // Ambil detail produk invoice
      const invoiceItems = await db
        .select({
          productName: invoice.productName,
          qty: invoice.quantity,
          price: invoice.price,
          subTotal: invoice.subtotal,
        })
        .from(invoice)
        .where(eq(invoice.saleId, searchInvoice.id));

      return res.status(200).json({
        success: true,
        message: "Invoice berhasil ditemukan",
        data: {
          invoiceNumber: searchInvoice.invoiceNumber,
          paidAmount: searchInvoice.paidAmount,
          paymentMethod: searchInvoice.paymentMethod,
          items: invoiceItems,
        },
      });
    } catch (error) {
      console.error("GET INVOICE ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat mengambil invoice",
      });
    }
  };
}

export default new Product();
