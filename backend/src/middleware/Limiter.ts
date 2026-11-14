import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit

  limit: 10, // Maksimal 10 request per IP

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message: "Terlalu banyak percobaan login. Silakan coba lagi nanti.",
  },

  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message: "Terlalu banyak percobaan login.",
      retryAfter: res.getHeader("Retry-After"),
    });
  },
});

export const requestOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Terlalu banyak permintaan OTP. Coba lagi nanti.",
  },
});

export const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Terlalu banyak percobaan. Coba lagi nanti.",
  },
});