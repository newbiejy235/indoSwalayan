import { Router } from "express";
import {
  createTransaction,
  handleNotification,
} from "../controller/payment/payment.controller";
import { authenticate } from "../middleware/users.middleware";

const router = Router();

// Endpoint untuk Flutter meminta transaksi pembayaran
router.post("/create", authenticate, createTransaction);

// Endpoint khusus menerima notifikasi dari Midtrans
router.post("/notification", handleNotification);

export default router;
