const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

require("dotenv").config();

const sendOTPEmail = async (to, name, otp) => {
  try {
    const response = await resend.emails.send({
      from: "Acme <onboarding@resend.dev>",
      to: to,
      subject: "Your OTP Code",
      html: `<div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border-radius: 10px; background: #f9f9f9; text-align: center;">
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
    });

    return response;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Failed to send OTP email.");
  }
};

module.exports = sendOTPEmail;
