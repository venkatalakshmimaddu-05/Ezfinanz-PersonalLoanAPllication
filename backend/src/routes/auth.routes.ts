import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as authController from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

// OTP endpoints are rate-limited to prevent spam/abuse of the (simulated) send.
const otpLimiter = rateLimit({ windowMs: 60 * 1000, max: 5 });

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/google", authController.googleOAuthSimulated);
router.post("/refresh", authController.refreshToken);

router.post("/otp/request", requireAuth, otpLimiter, authController.requestOtp);
router.post("/otp/verify", requireAuth, authController.verifyOtpHandler);

router.get("/me", requireAuth, authController.me);

export default router;
