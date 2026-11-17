import { Request, Response } from "express";
import { eq, and, isNull, desc, sql } from "drizzle-orm";

import crypto from "crypto";
import bcrypt from "bcryptjs";

import { db } from "../../config/db";

import {
  usersTable,
  karyawan,
  passwordResetOtps,
  role,
} from "../../config/schema";

import { sendOtpEmail } from "../../utils/otpSend";

// ========================================
// HELPER: HASH OTP
// ========================================

const hashOtp = (otp: string): string => {
  const secret = process.env.OTP_SECRET;

  if (!secret) {
    throw new Error("OTP_SECRET belum dikonfigurasi");
  }

  return crypto.createHmac("sha256", secret).update(otp).digest("hex");
};

// ========================================
// HELPER: VALIDASI OTP
// ========================================

const compareOtp = (otp: string, storedHash: string): boolean => {
  const inputHash = hashOtp(otp);

  const inputBuffer = Buffer.from(inputHash, "hex");
  const storedBuffer = Buffer.from(storedHash, "hex");

  if (inputBuffer.length !== storedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(inputBuffer, storedBuffer);
};

// ========================================
// REQUEST OTP
// ========================================

export const requestOtp = async (req: Request, res: Response) => {
  try {
    const { email, accountType } = req.body;

    // Validasi input
    if (typeof email !== "string" || typeof accountType !== "string") {
      return res.status(400).json({
        message: "Email dan role wajib diisi",
      });
    }

    if (!["pemilik", "kasir"].includes(accountType)) {
      return res.status(400).json({
        message: "Role tidak valid",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (
      normalizedEmail.length > 30 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return res.status(400).json({
        message: "Format email tidak valid",
      });
    }

    // Cari akun berdasarkan role
    let accountExists = false;

    if (accountType === "pemilik") {
      const [user] = await db
        .select({
          id: usersTable.id,
        })
        .from(usersTable)
        .where(eq(usersTable.email, normalizedEmail))
        .limit(1);

      accountExists = !!user;
    } else {
      const [cashier] = await db
        .select({
          id: karyawan.id,
        })
        .from(karyawan)
        .where(eq(karyawan.email, normalizedEmail))
        .limit(1);

      accountExists = !!cashier;
    }

    // Hindari email enumeration
    if (!accountExists) {
      return res.status(200).json({
        message: "Jika email terdaftar, OTP akan dikirim.",
      });
    }

    // Generate OTP 6 digit
    const otp = crypto.randomInt(100000, 1000000).toString();

    // Hash OTP menggunakan HMAC
    const otpHash = hashOtp(otp);

    // Waktu expired
    const expiresAt = new Date(
      Date.now() + Number(process.env.OTP_EXPIRES_MINUTES || 5) * 60 * 1000,
    );

    // Nonaktifkan OTP sebelumnya
    await db
      .update(passwordResetOtps)
      .set({
        usedAt: new Date(),
      })
      .where(
        and(
          eq(passwordResetOtps.email, normalizedEmail),
          eq(passwordResetOtps.accountType, accountType as "pemilik" | "kasir"),
          isNull(passwordResetOtps.usedAt),
        ),
      );

    // Simpan OTP baru
    const [newOtp] = await db
      .insert(passwordResetOtps)
      .values({
        email: normalizedEmail,
        accountType: accountType as "pemilik" | "kasir",
        otpHash,
        expiresAt,
      })
      .returning({
        id: passwordResetOtps.id,
      });

    try {
      // Kirim OTP melalui email
      await sendOtpEmail({
        email: normalizedEmail,
        otp,
      });
    } catch (mailError) {
      // Jika email gagal dikirim,
      // nonaktifkan OTP yang baru dibuat.
      await db
        .update(passwordResetOtps)
        .set({
          usedAt: new Date(),
        })
        .where(eq(passwordResetOtps.id, newOtp.id));

      throw mailError;
    }

    return res.status(200).json({
      message: "OTP berhasil dikirim ke email",
    });
  } catch (error) {
    console.error("REQUEST OTP ERROR:", error);

    return res.status(500).json({
      message: "Gagal mengirim OTP",
    });
  }
};

// ========================================
// RESET PASSWORD
// ========================================

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, accountType, otp, newPassword } = req.body;

    // Validasi input
    if (
      typeof email !== "string" ||
      typeof accountType !== "string" ||
      typeof otp !== "string" ||
      typeof newPassword !== "string"
    ) {
      return res.status(400).json({
        message: "Semua field wajib diisi",
      });
    }

    if (!["pemilik", "kasir"].includes(accountType)) {
      return res.status(400).json({
        message: "Role tidak valid",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        message: "Format OTP harus 6 digit",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "Password minimal 8 karakter",
      });
    }

    // Cari OTP terbaru yang belum digunakan
    const [resetOtp] = await db
      .select()
      .from(passwordResetOtps)
      .where(
        and(
          eq(passwordResetOtps.email, normalizedEmail),
          eq(passwordResetOtps.accountType, accountType as "pemilik" | "kasir"),
          isNull(passwordResetOtps.usedAt),
        ),
      )
      .orderBy(desc(passwordResetOtps.createdAt))
      .limit(1);

    if (!resetOtp) {
      return res.status(400).json({
        message: "OTP tidak ditemukan atau sudah digunakan",
      });
    }

    // Cek expired
    if (resetOtp.expiresAt.getTime() <= Date.now()) {
      return res.status(400).json({
        message: "OTP sudah kedaluwarsa",
      });
    }

    // Cek maksimal percobaan
    const maxAttempts = Number(process.env.OTP_MAX_ATTEMPTS || 5);

    if (resetOtp.attempts >= maxAttempts) {
      return res.status(429).json({
        message: "Batas percobaan OTP telah tercapai",
      });
    }

    // Verifikasi OTP
    const isValidOtp = compareOtp(otp, resetOtp.otpHash);

    if (!isValidOtp) {
      await db
        .update(passwordResetOtps)
        .set({
          attempts: sql`${passwordResetOtps.attempts} + 1`,
        })
        .where(eq(passwordResetOtps.id, resetOtp.id));

      return res.status(400).json({
        message: "OTP yang dimasukkan salah",
      });
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // =====================================
    // UPDATE PASSWORD
    // =====================================

    if (accountType === "pemilik") {
      await db
        .update(usersTable)
        .set({
          password: hashedPassword,
        })
        .where(eq(usersTable.email, normalizedEmail));
    } else {
      await db
        .update(karyawan)
        .set({
          password: hashedPassword,
        })
        .where(eq(karyawan.email, normalizedEmail));
    }

    // =====================================
    // UPDATE USED AT
    // =====================================

    await db
      .update(passwordResetOtps)
      .set({
        usedAt: new Date(),
      })
      .where(eq(passwordResetOtps.id, resetOtp.id));

    return res.status(200).json({
      message: "Password berhasil diperbarui",
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);

    return res.status(500).json({
      message: "Gagal mereset password",
    });
  }
};
