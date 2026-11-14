import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "nama minimal 1 karakter"),
  email: z.email(),
  password: z.string().min(6),
  phone_number : z.string().min(13, "minimal 13 karakter")
});

export const kasirSchema = z.object({
  first_name: z.string().min(1, "nama minimal 1 karakter"),
  last_name: z.string().min(1, "nama minimal 1 karakter"),
  email: z.email(),
  password: z.string().min(6),
  phone_number : z.string().min(13, "minimal 13 karakter")
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});
