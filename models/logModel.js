const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  articleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Article",
    required: false,
  },
  action: {
    type: String,
    enum: ["vote", "comment", "login", "logout", "register"],
    required: true,
  },
  tags: [
    {
      type: String,
      required: false,
    },
  ],
  details: { type: String, default: "" },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Log", logSchema);
