const nodemailer = require("nodemailer");
require("dotenv").config(); // Load variabel lingkungan dari .env

// Konfigurasi SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === "true", // false untuk TLS (587), true untuk SSL (465)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Bisa dihapus jika tidak perlu
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
const sendOTPEmail = async (email, otp, name = "Pengguna") => {
  const mailOptions = {
    from: `"HoaxHunter Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "🔑 Kode OTP Verifikasi Akun Anda",
    text: `Halo ${name}, kode OTP Anda adalah: ${otp}. Berlaku selama 5 menit.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border-radius: 10px; background: #f9f9f9; text-align: center;">
        <h2 style="color: #4CAF50;">🔑 Kode OTP Anda</h2>
        <p style="font-size: 16px; color: #333;">Halo <strong>${name}</strong>,</p>
        <p style="font-size: 16px; color: #555;">Gunakan kode di bawah ini untuk memverifikasi akun Anda:</p>
        <div style="font-size: 22px; font-weight: bold; background: #4CAF50; color: white; padding: 15px; border-radius: 8px; display: inline-block;">
          ${otp}
        </div>
        <p style="font-size: 14px; color: #777; margin-top: 20px;">Kode ini hanya berlaku selama <strong>5 menit</strong>. Jangan berikan kode ini kepada siapa pun.</p>
        <hr style="margin: 20px 0;">
        <p style="font-size: 12px; color: #999;">Jika Anda tidak meminta kode ini, abaikan email ini.</p>
        <p style="font-size: 12px; color: #999;">🚀 HoaxHunter Support</p>
      </div>
    `,
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
