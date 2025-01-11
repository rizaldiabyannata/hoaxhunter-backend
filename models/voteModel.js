const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Referensi ke model User
    required: true,
  },
  isHoax: {
    type: Boolean, // `true` jika hoax, `false` jika tidak
    required: true,
  },
});

module.exports = voteSchema; // Hanya export schema
