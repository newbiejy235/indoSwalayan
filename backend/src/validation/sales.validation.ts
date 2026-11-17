import { z } from "zod";

export const salesSchema = z.object({
  items: z
    .array(
      z.object({
        barcode: z.string(),
        quantity: z.coerce.number().int().min(1),
      }),
    )
    .min(1, "Keranjang tidak boleh kosong"),

  paidAmount: z.coerce.number().finite().positive(),

  paymentMethod: z.enum(["tunai", "non tunai"]),
});
