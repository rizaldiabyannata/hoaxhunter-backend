const mongoose = require("mongoose");
const voteSchema = require("./voteModel");
const commentSchema = require("./commentModel");

const hoaxSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  files: [
    {
      url: {
        type: String,
        required: true,
      },
      fileType: {
        type: String,
        required: true,
      },
    },
  ],
  votes: [voteSchema], // Array untuk menyimpan vote
  comments: [commentSchema], // Array untuk menyimpan komentar
  totalVotes: {
    hoax: {
      type: Number,
      default: 0,
    },
    notHoax: {
      type: Number,
      default: 0,
    },
  },
  tags: {
    type: [String], // Array string untuk menyimpan tag
    default: ["all"], // Default tag adalah "all"
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Hoax = mongoose.model("Hoax", hoaxSchema);
module.exports = Hoax;
