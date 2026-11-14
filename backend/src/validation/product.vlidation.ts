import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().trim().min(1).max(150),

  description: z.string().nullable().optional(),

  barcode: z.string().trim().max(100).nullable().optional(),

  price: z.coerce.number().finite().min(0),

  stock: z.coerce.number().int().min(0),
});
