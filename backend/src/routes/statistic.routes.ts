import { Router } from "express";
import { authenticate } from "../middleware/users.middleware";
import { isOwner } from "../middleware/users.middleware";
import statisticController from "../controller/statistic/statistic.controller";

const router = Router();

router.get("/sales", authenticate, isOwner, statisticController.seller);
router.get(
  "/popular-product",
  authenticate,
  isOwner,
  statisticController.popularProduct,
);
router.get("/income", authenticate, isOwner, statisticController.income);

export default router;
