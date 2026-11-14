
import { z } from "zod";

// Request OTP pemilik
export const ownerRequestOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Format email tidak valid")
    .max(30, "Email maksimal 30 karakter"),
});

// Reset password pemilik
export const ownerResetPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Format email tidak valid")
    .max(30, "Email maksimal 30 karakter"),

  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "OTP harus terdiri dari 6 digit"),

  newPassword: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(72, "Password maksimal 72 karakter"),
});

export type OwnerRequestOtpInput = z.infer<
  typeof ownerRequestOtpSchema
>;

export type OwnerResetPasswordInput = z.infer<
  typeof ownerResetPasswordSchema
>;

// Request OTP kasir
export const cashierRequestOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Format email tidak valid")
    .max(30, "Email maksimal 30 karakter"),
});

// Reset password kasir
export const cashierResetPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Format email tidak valid")
    .max(30, "Email maksimal 30 karakter"),

  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "OTP harus terdiri dari 6 digit"),

  newPassword: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(72, "Password maksimal 72 karakter"),
});

export type CashierRequestOtpInput = z.infer<
  typeof cashierRequestOtpSchema
>;

export type CashierResetPasswordInput = z.infer<
  typeof cashierResetPasswordSchema
>;
