import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().trim().min(1, "minimal 1 huruf"),

  description: z.string().nullable().optional(),

  barcode: z.string().trim().max(100).nullable().optional(),

  price: z.coerce.number().finite().min(0, "tidak boleh kurang dari 0"),

  stock: z.coerce.number().int().min(0, "tidak boleh kurang dari 0"),
});

export const editProductSchema = z
  .object({
    name: z.string().trim().min(1, "Nama produk wajib diisi").optional(),

    price: z.coerce
      .number()
      .finite()
      .min(0, "Harga tidak boleh kurang dari 0")
      .optional(),

    description: z.string().nullable().optional(),

    barcode: z.string().trim().max(100).nullable().optional(),

    isActive: z
      .union([
        z.boolean(),
        z.enum(["true", "false"]).transform((v) => v === "true"),
      ])
      .optional(),

    stock: z.coerce
      .number()
      .int()
      .min(0, "Stok tidak boleh kurang dari 0")
      .optional(),
  })
  .strip();
