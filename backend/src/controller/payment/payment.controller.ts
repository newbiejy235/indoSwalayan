import { Request, Response } from "express";
import "dotenv/config";
import { and, eq } from "drizzle-orm";

import { snap, MidtransSnap } from "../../config/midtrans";
import { db } from "../../config/db";
import { sales } from "../../config/schema";

// CREATE TRANSACTION
export const createTransaction = async (req: Request, res: Response) => {
  try {
    const { invoiceNumber } = req.body;

    if (!invoiceNumber) {
      return res.status(400).json({
        success: false,
        message: "Invoice number wajib diisi",
      });
    }

    // Cari invoice yang menunggu pembayaran
    const [sale] = await db
      .select()
      .from(sales)
      .where(
        and(
          eq(sales.invoiceNumber, invoiceNumber),
          eq(sales.status, "menunggu"),
          eq(sales.paymentMethod, "non tunai"),
        ),
      );

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Pesanan tidak ditemukan atau tidak dapat dibayar",
      });
    }

    const parameter = {
      transaction_details: {
        order_id: sale.invoiceNumber,
        gross_amount: Number(sale.total),
      },
    };

    const transaction = await snap.createTransaction(parameter);

    return res.status(200).json({
      success: true,
      token: transaction.token,
      redirect_url: transaction.redirect_url,
    });
  } catch (error) {
    console.error("Create transaction error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create transaction",
    });
  }
};

// HANDLE NOTIFICATION
export const handleNotification = async (req: Request, res: Response) => {
  try {
    const midtrans = snap as MidtransSnap;

    // Verifikasi notifikasi melalui Midtrans
    const statusResponse = await midtrans.transaction.notification(req.body);

    const {
      order_id,
      transaction_status,
      fraud_status,
      gross_amount,
      status_code,
    } = statusResponse;

    // Pastikan status transaksi valid
    if (
      (transaction_status === "capture" ||
        transaction_status === "settlement") &&
      status_code !== "200"
    ) {
      return res.status(400).json({
        success: false,
        message: "Status transaksi tidak valid",
      });
    }

    // Cari invoice
    const [sale] = await db
      .select()
      .from(sales)
      .where(eq(sales.invoiceNumber, order_id));

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Invoice tidak ditemukan",
      });
    }

    // Validasi nominal
    if (Number(sale.total) !== Number(gross_amount)) {
      return res.status(400).json({
        success: false,
        message: "Nominal pembayaran tidak sesuai",
      });
    }

    // Tentukan status penjualan
    let saleStatus: "menunggu" | "selesai" | "belum dibayar" | null = null;

    if (transaction_status === "pending") {
      saleStatus = "menunggu";
    } else if (transaction_status === "capture" && fraud_status === "accept") {
      saleStatus = "selesai";
    } else if (transaction_status === "settlement") {
      saleStatus = "selesai";
    } else if (
      transaction_status === "cancel" ||
      transaction_status === "expire" ||
      transaction_status === "deny"
    ) {
      saleStatus = "belum dibayar";
    }

    if (saleStatus === null) {
      return res.status(200).json({
        success: true,
        message: "Notification diterima, tidak ada perubahan status",
      });
    }

    // Jangan menurunkan status transaksi yang sudah selesai
    if (sale.status === "selesai") {
      return res.status(200).json({
        success: true,
        message: "Transaksi sudah selesai",
      });
    }

    // Update database
    await db
      .update(sales)
      .set({
        status: saleStatus,
        ...(saleStatus === "selesai"
          ? {
              paidAmount: sale.total,
              changeAmount: "0",
            }
          : {}),
      })
      .where(
        and(eq(sales.invoiceNumber, order_id), eq(sales.status, "menunggu")),
      );

    return res.status(200).json({
      success: true,
      message: "Notification berhasil diproses",
    });
  } catch (error) {
    console.error("Notification error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process notification",
    });
  }
};
