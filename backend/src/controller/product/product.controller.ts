import { Request, Response } from "express";
import { eq, sql } from "drizzle-orm";

import { db } from "../../config/db";
import { products } from "../../config/schema";
import { createProductSchema } from "../../validation/product.vlidation";
import { AuthRequest } from "../../middleware/users.middleware";
import { uploadProductPhoto } from "../../utils/cloudinaryUpload";

export class Product {
  createProduct = async (req: AuthRequest, res: Response) => {
    let uploadedPublicId: string | undefined;
    try {
      const isOwner = req.user?.role;

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: "anda tidak diizinkan akses ini",
        });
      }

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
}

export default new Product();
