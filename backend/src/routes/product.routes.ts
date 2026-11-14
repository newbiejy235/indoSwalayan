import { Router } from "express";
import { authenticate } from "../middleware/users.middleware";
import Product from "../controller/product/product.controller";
import { productUpload } from "../middleware/cloudinary";
const router = Router();

router.post("/tambah", authenticate, productUpload.single("image"), Product.createProduct);

export default router
