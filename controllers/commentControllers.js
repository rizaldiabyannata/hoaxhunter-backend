const Hoax = require("../models/hoaxModel");

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

module.exports = { addComment };
