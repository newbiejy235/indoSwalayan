import { Router } from "express";
import dataKaryawan from "../controller/karyawan/karyawan.controller";
import { authenticate } from "../middleware/users.middleware";
import { isOwner } from "../middleware/users.middleware";

const router = Router();

router.get("/karyawan", authenticate, isOwner, dataKaryawan.getDataKaryawan);

export default router;
