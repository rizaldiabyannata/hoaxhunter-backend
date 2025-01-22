const express = require("express");
const {
  register,
  login,
  logout,
  verifyOTP,
  resendOTP,
} = require("../controllers/authControllers");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", authMiddleware, logout);

router.get("/check", authMiddleware, (req, res) => {
  res.json({ user: { id: req.user.id, role: req.user.role } });
});

router.post("/verify-otp", verifyOTP); // Verifikasi OTP
router.post("/resend-otp", resendOTP); // Kirim ulang OTP

module.exports = router;
