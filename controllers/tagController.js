const User = require("../models/userModel");
const Tag = require("../models/tagModel");

const followTag = async (req, res) => {
  try {
    const userId = req.user.id; // ID user dari middleware autentikasi
    const { tagId } = req.body;

    // Validasi tag
    const tag = await Tag.findById(tagId);
    if (!tag) {
      return res.status(404).json({ error: "Tag not found" });
    }

    // Update user untuk mengikuti tag
    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { followedTags: tagId } }, // Menambahkan tag jika belum ada
      { new: true }
    ).populate("followedTags");

    res.status(200).json({ message: "Tag followed successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

const unfollowTag = async (req, res) => {
  try {
    const userId = req.user.id; // ID user dari middleware autentikasi
    const { tagId } = req.body;

    // Validasi tag
    const tag = await Tag.findById(tagId);
    if (!tag) {
      return res.status(404).json({ error: "Tag not found" });
    }

    // Update user untuk berhenti mengikuti tag
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { followedTags: tagId } }, // Menghapus tag dari array
      { new: true }
    ).populate("followedTags");

    res.status(200).json({ message: "Tag unfollowed successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { followTag, unfollowTag };
