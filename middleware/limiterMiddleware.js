const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5, // Maksimum 5 request per 15 menit dari satu IP
  message: {
    error: "Terlalu banyak percobaan login. Coba lagi nanti.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 menit
  max: 5, // Maksimum 5 request dalam 10 menit
  message: {
    error: "Terlalu banyak percobaan verifikasi OTP. Coba lagi nanti.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { loginLimiter, otpLimiter };
