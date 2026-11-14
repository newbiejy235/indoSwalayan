import { Router } from "express";
import Authentication from "../controller/auth/auth.controller";
import { authenticate } from "../middleware/users.middleware";
import { loginLimiter } from "../middleware/Limiter";
const router = Router();

router.post("/login", loginLimiter, Authentication.login);
router.post("/register", loginLimiter, Authentication.register);
router.post("/register/karyawan", loginLimiter, authenticate, Authentication.kasirRegister);
router.post("/login/karyawan", loginLimiter, Authentication.kasirLogin);

export default router;
