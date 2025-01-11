import mongoose from "mongoose";

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
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
