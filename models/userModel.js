const mongoose = require("mongoose");
const notificationSchema = require("./notificationModel");

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
    notifications: [notificationSchema],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
