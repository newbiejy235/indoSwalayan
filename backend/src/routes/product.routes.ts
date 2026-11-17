import { Router } from "express";
import { authenticate } from "../middleware/users.middleware";
import Product from "../controller/product/product.controller";
import { productUpload } from "../middleware/cloudinary";
import { isOwner } from "../middleware/users.middleware";
import { management } from "../middleware/users.middleware";
const router = Router();

router.post(
  "/tambah",
  authenticate,
  isOwner,
  productUpload.single("image"),
  Product.createProduct,
);

router.get("/", Product.getAllProduct);

// kasir

router.post("/sale", authenticate, management, Product.saleProduct);
router.post("/scaner", authenticate, management, Product.scaner);

export default router;
