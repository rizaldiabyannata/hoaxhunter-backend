const Hoax = require("../models/hoaxModel");
const { addHistory } = require("../utils/history");
const logActivity = require("../utils/logService");

const addComment = async (req, res) => {
  try {
    const { hoaxId, text } = req.body;
    const file = req.file; // File diambil dari Multer

    console.log("req.file : ", req.file);

    if (!hoaxId || !text) {
      return res
        .status(400)
        .json({ error: "Hoax ID and comment text are required" });
    }

    const hoax = await Hoax.findById(hoaxId);

    if (!hoax) {
      return res.status(404).json({ error: "Hoax not found" });
    }

    const filename = file ? file.filename : null;

    const newComment = {
      user: req.user.id,
      text,
      attachment: `${req.protocol}://${req.get("host")}/uploads/${filename}`,
    };

    hoax.comments.push(newComment);

    await hoax.save();

    const commentIndex = hoax.comments.length - 1;
    const commentId = hoax.comments[commentIndex]._id;

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
