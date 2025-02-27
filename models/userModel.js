const mongoose = require("mongoose");
const notificationSchema = require("./notificationModel");
const historySchema = require("./historyModel");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, match: /.+\@.+\..+/ },
    password: { type: String, required: true },
    rank: {
      type: String,
      enum: ["bronze", "iron", "gold", "platinum", "emerald"],
      default: "bronze",
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    followedTags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag",
        default: ["all"],
      },
    ],
    slug: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },
    notifications: [notificationSchema],
    history: [historySchema],
    isVerified: { type: Boolean, default: false }, // Status verifikasi OTP
    otp: String, // OTP yang dikirim ke email
    otpExpires: Date, // Waktu kedaluwarsa OTP
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
