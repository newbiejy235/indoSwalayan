import { Router } from "express";
import {
  requestOtp,
  resetPassword,
} from "../controller/resetPassword/resetPassword.controller";
import { requestOtpLimiter, resetPasswordLimiter } from "../middleware/Limiter";
const router = Router();

router.post("/request/otp", requestOtpLimiter, requestOtp);

// Reset Password
router.post("/request/password", resetPasswordLimiter, resetPassword);

export default router;
