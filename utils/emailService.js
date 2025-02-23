const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP,
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER, // Email kamu
    pass: process.env.EMAIL_PASS, // Password atau App Password dari Google
  },
});

const sendOTPEmail = async (to, name, otp) => {
  try {
    const mailOptions = {
      from: `"HoaxHunter Support" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Your OTP Code",
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

    const response = await transporter.sendMail(mailOptions);
    return response;
  } catch (error) {
    throw new Error("Failed to send OTP email.");
  }
};

module.exports = sendOTPEmail;
