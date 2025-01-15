const Hoax = require("../models/hoaxModel");
const { addHistory } = require("../utils/history");
const logActivity = require("../utils/logService");

const fs = require("fs");
const path = require("path");

const addComment = async (req, res) => {
  try {
    const { hoaxId, text } = req.body;
    const file = req.file; // File diambil dari Multer

    console.log("req.file : ", req.file);

    // Validasi input
    if (!hoaxId || !text) {
      throw new Error("Hoax ID and comment text are required");
    }

    // Validasi keberadaan hoax
    const hoax = await Hoax.findById(hoaxId);
    if (!hoax) {
      throw new Error("Hoax not found");
    }

    // Proses attachment
    const filename = file ? file.filename : null;
    const attachmentUrl = file
      ? `${req.protocol}://${req.get("host")}/uploads/${filename}`
      : null;

    // Buat komentar baru
    const newComment = {
      user: req.user.id,
      text,
      attachment: attachmentUrl,
    };

    hoax.comments.push(newComment);
    await hoax.save();

    // Ambil ID komentar terbaru
    const commentIndex = hoax.comments.length - 1;
    const commentId = hoax.comments[commentIndex]._id;

    // Tambahkan ke history dan log aktivitas
    await addHistory(
      req.user.id,
      "comment",
      commentId,
      `Commented on article: ${hoaxId}`
    );

    await logActivity(
      req.user.id,
      hoaxId,
      "comment",
      hoax.tags,
      newComment.text
    );

    res
      .status(201)
      .json({ message: "Comment added successfully", comments: hoax.comments });
  } catch (error) {
    console.error(error);

    // Hapus file jika terjadi kesalahan
    if (req.file && req.file.filename) {
      const filePath = path.join(__dirname, "../uploads/", req.file.filename);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Failed to delete file: ${filePath}`, err);
        } else {
          console.log(`File deleted: ${filePath}`);
        }
      });
    }

    res
      .status(500)
      .json({ error: "An error occurred while adding the comment" });
  }
};

const replyToComment = async (req, res) => {
  try {
    const { articleId, commentId, text } = req.body;
    const file = req.file; // File diambil dari Multer
    const userId = req.user.id;

    if (!text) {
      return res.status(400).json({ error: "Reply text is required" });
    }

    const article = await Hoax.findById(articleId);

    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    const comment = article.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    comment.replies.push({
      user: userId,
      text,
      attachment: file ? file.path : null, // Tambahkan path file jika ada
    });

    await article.save();

    await addHistory(
      userId,
      "comment",
      comment._id,
      `Commented on article: ${articleId}`
    );

    res.status(200).json({ message: "Reply added successfully", comment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { addComment, replyToComment };
