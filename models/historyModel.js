const mongoose = require("mongoose");

const historySchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ["upload_article", "vote", "comment"],
    required: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  details: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = historySchema;
