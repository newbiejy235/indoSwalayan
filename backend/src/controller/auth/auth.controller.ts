import { db } from "../../config/db";
import { Request, Response } from "express";
import { karyawan, usersTable } from "../../config/schema";
import {
  loginSchema,
  registerSchema,
  kasirSchema,
} from "../../validation/auth.validation";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { and, eq } from "drizzle-orm";
import { ZodError } from "zod";
import dotenv from "dotenv";
import crypto from "node:crypto"; // atau const crypto = require("crypto");
import { AuthRequest } from "../../middleware/users.middleware";

function generateSixDigitCode() {
  // Menghasilkan angka acak dari 100000 sampai 999999
  const code = crypto.randomInt(100000, 1000000);
  return code.toString();
}

dotenv.config();

export class Authentication {
  register = async (req: Request, res: Response) => {
    try {
      const { email, password, name, phone_number } = registerSchema.parse(
        req.body,
      );

      const existingAccount = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email));

      if (existingAccount.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Email sudah terdaftar",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const addEmail = await db.insert(usersTable).values({
        name: name,
        email: email,
        password: hashedPassword,
        phone_number: phone_number,
      });

      return res.status(201).json({
        success: true,
        message: "akun berhasil dibuat",
      });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validasi gagal",
          errors: error.flatten().fieldErrors,
        });
      }

      const dbError = error?.cause;
      if (dbError.code === "23505") {
        if (dbError.constraint === "users_single_pemilik_idx") {
          return res.status(409).json({
            success: false,
            message: "Akun pemilik sudah terdaftar",
          });
        }
      }

      return res.status(500).json({
        success: false,
        message: "internal server error",
      });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const loginValidation = loginSchema.parse(req.body);
      const { email, password } = loginValidation;

      const [tryLogin] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1);

      if (!tryLogin) {
        return res.status(404).json({
          success: false,
          message: "password atau email salah",
        });
      }

      const rehashedPassword = await bcrypt.compare(
        password,
        tryLogin.password,
      );

      if (!rehashedPassword) {
        return res.status(404).json({
          success: false,
          message: "password atau email salah",
        });
      }

      const JWT_SECRET = process.env.JWT_SECRET;

      if (!JWT_SECRET || JWT_SECRET.length < 32) {
        throw new Error("JWT_SECRET tidak valid");
      }

      const token = jwt.sign(
        {
          userId: tryLogin.id,
          email: tryLogin.email,
          role: tryLogin.role,
        },
        JWT_SECRET,

        {
          expiresIn: "1d",
        },
      );

      return res.status(200).json({
        success: true,
        message: "Berhasil login",
        userData: {
          userId: tryLogin.id,
          email: tryLogin.email,
          role: tryLogin.role,
          token: token,
        },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validasi gagal",
          errors: error.flatten().fieldErrors,
        });
      }
      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
      });
    }
  };

  kasirRegister = async (req: AuthRequest, res: Response) => {
    try {
      const isOwner = req.user?.role;
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: "anda tidak memiliki akses",
        });
      }
      const { email, password, phone_number, first_name, last_name } =
        kasirSchema.parse(req.body);

      const existingAccount = await db
        .select()
        .from(karyawan)
        .where(eq(karyawan.email, email));

      if (existingAccount.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Email sudah terdaftar",
        });
      }

      const kodeKaryawan = generateSixDigitCode();

      const hashedPassword = await bcrypt.hash(password, 10);

      const addEmail = await db.insert(karyawan).values({
        code: `EMP-${kodeKaryawan}`,
        first_name: first_name,
        last_name: last_name,
        email: email,
        password: hashedPassword,
        phone_number: phone_number,
      });

      return res.status(201).json({
        success: true,
        message: "akun berhasil dibuat",
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validasi gagal",
          errors: error.flatten().fieldErrors,
        });
      }
      return res.status(500).json({
        success: false,
        message: "internal server error",
      });
    }
  };

  kasirLogin = async (req: Request, res: Response) => {
    try {
      const loginValidation = loginSchema.parse(req.body);
      const { email, password } = loginValidation;

      const [tryLogin] = await db
        .select()
        .from(karyawan)
        .where(eq(karyawan.email, email))
        .limit(1);

      if (!tryLogin) {
        return res.status(404).json({
          success: false,
          message: "password atau email salah",
        });
      }

      const rehashedPassword = await bcrypt.compare(
        password,
        tryLogin.password,
      );

      if (!rehashedPassword) {
        return res.status(404).json({
          success: false,
          message: "password atau email salah",
        });
      }

      const JWT_SECRET = process.env.JWT_SECRET;

      if (!JWT_SECRET || JWT_SECRET.length < 32) {
        throw new Error("JWT_SECRET tidak valid");
      }

      const token = jwt.sign(
        {
          userId: tryLogin.id,
          email: tryLogin.email,
          role: tryLogin.role,
        },
        JWT_SECRET,

        {
          expiresIn: "1d",
        },
      );

      return res.status(200).json({
        success: true,
        message: "Berhasil login",
        userData: {
          userId: tryLogin.id,
          email: tryLogin.email,
          role: tryLogin.role,
          nama_depan: tryLogin.first_name,
          nama_belakang: tryLogin.first_name,
          no_telp: tryLogin.phone_number,
          code_kaaryawan: tryLogin.code,
        },
        token: token,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validasi gagal",
          errors: error.flatten().fieldErrors,
        });
      }
      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
      });
    }
  };
}

export default new Authentication();
