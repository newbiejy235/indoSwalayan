import { Request, Response } from "express";
import { db } from "../../config/db";
import { karyawan } from "../../config/schema";
import { eq } from "drizzle-orm";

export class dataKaryawan {
  getDataKaryawan = async (req: Request, res: Response) => {
    try {
      const data = await db
        .select({
          code: karyawan.code,
          first_name: karyawan.first_name,
          last_name: karyawan.last_name,
          email: karyawan.email,
          phone_number: karyawan.phone_number,
        })
        .from(karyawan);
      if (data.length === 0) {
        return res.status(404).json({
          success: false,
          message: "karyawan tidak ditemukan, rekrut karyawan",
        });
      }

      return res.status(200).json({
        success: true,
        message: "berhasil ambil data",
        data: data,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
}

export default new dataKaryawan();
