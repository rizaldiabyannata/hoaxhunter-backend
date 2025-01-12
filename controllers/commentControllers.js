const Hoax = require("../models/hoaxModel");
const { addHistory } = require("../utils/history");

const addComment = async (req, res) => {
  try {
    const { hoaxId, text } = req.body;

    if (!hoaxId || !text) {
      return res
        .status(400)
        .json({ error: "Hoax ID and comment text are required" });
    }

    const hoax = await Hoax.findById(hoaxId);

    if (!hoax) {
      return res.status(404).json({ error: "Hoax not found" });
    }

    const newComment = {
      user: req.user.id, // Ambil user ID dari middleware autentikasi
      text,
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

    // Tambahkan balasan ke komentar
    comment.replies.push({ user: userId, text });

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
