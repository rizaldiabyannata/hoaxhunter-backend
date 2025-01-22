const nodemailer = require("nodemailer");
require("dotenv").config(); // Load variabel lingkungan dari .env

// Konfigurasi SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.ethereal.email",
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Verifikasi koneksi SMTP sebelum mengirim email
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP Connection Error:", error);
  } else {
    console.log("✅ SMTP Server is ready to take messages");
  }
});

// Fungsi untuk mengirim OTP
const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: `"No Reply" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Kode OTP Verifikasi Akun",
    text: `Kode OTP Anda adalah: ${otp}. Berlaku selama 5 menit.`,
    html: `<p>Kode OTP Anda adalah: <strong>${otp}</strong>. Berlaku selama 5 menit.</p>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ OTP dikirim ke ${email}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("❌ Gagal mengirim OTP:", error);
    return false;
  }
};

module.exports = sendOTPEmail;
