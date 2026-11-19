import { Request, Response } from "express";
import "dotenv/config";
import { snap } from "../../config/midtrans";
import { MidtransSnap } from "../../config/midtrans";
import { db } from "../../config/db";
import { sales } from "../../config/schema";
import { salesSchema } from "../../validation/sales.validation";
import { and, eq } from "drizzle-orm";

// CREATE TRANSACTION
export const createTransaction = async (req: Request, res: Response) => {
  try {
    const { invoiceNumber } = req.body;
    const [isExist] = await db
      .select()
      .from(sales)
      .where(
        and(
          eq(sales.invoiceNumber, invoiceNumber),
          eq(sales.status, "menunggu"),
        ),
      );

    if (!isExist) {
      return res.status(404).json({
        success: false,
        message: "pesanan tidak ditemukan",
      });
    }
    const parameter = {
      transaction_details: {
        order_id: isExist.invoiceNumber,
        gross_amount: Number(isExist.total),
      },
    };

    const transaction = await snap.createTransaction(parameter);

    return res.status(200).json({
      token: transaction.token,
      redirect_url: transaction.redirect_url,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to create transaction",
    });
  }
};

// HANDLE NOTIFICATION
export const handleNotification = async (req: Request, res: Response) => {
  try {
    const midtrans = snap as MidtransSnap;

    const statusResponse = await midtrans.transaction.notification(req.body);

    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    let saleStatus: "menunggu" | "belum dibayar" | null = null;

    if (transactionStatus === "capture" && fraudStatus === "accept") {
      saleStatus = "menunggu";
    } else if (transactionStatus === "settlement") {
      saleStatus = "menunggu";
    } else if (
      transactionStatus === "cancel" ||
      transactionStatus === "expire" ||
      transactionStatus === "deny"
    ) {
      saleStatus = "belum dibayar";
    }

    if (saleStatus !== null) {
      await db
        .update(sales)
        .set({
          status: saleStatus,
          ...(saleStatus === "menunggu"
            ? {
                paidAmount: sales.total,
                changeAmount: "0",
              }
            : {}),
        })
        .where(eq(sales.invoiceNumber, orderId));
    }

    console.log({
      orderId,
      transactionStatus,
      fraudStatus,
      saleStatus,
    });

    // TODO: Update payment status di database
    // Validasi order ID, nominal, dan status sebelumnya.

    return res.status(200).json({
      message: "Notification received",
    });
  } catch (error) {
    console.error("Notification error:", error);

    return res.status(500).json({
      message: "Failed to process notification",
    });
  }
};
