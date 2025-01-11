const User = require("../models/userModel");
const Tag = require("../models/tagModel");

const createTag = async (req, res) => {
  try {
    const { name } = req.body;

    // Validasi input
    if (!name) {
      return res.status(400).json({ error: "Tag name is required" });
    }

    // Cek apakah tag dengan nama yang sama sudah ada
    const existingTag = await Tag.findOne({ name: name.toLowerCase() });
    if (existingTag) {
      return res
        .status(400)
        .json({ error: "Tag with this name already exists" });
    }

    // Buat tag baru
    const tag = new Tag({
      name: name.toLowerCase(), // Simpan nama tag dalam huruf kecil untuk konsistensi
    });

    await tag.save();

    res.status(201).json({ message: "Tag created successfully", tag });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

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

const deleteTag = async (req, res) => {
  try {
    const { id } = req.params;

    // Hapus tag berdasarkan ID
    const tag = await Tag.findByIdAndDelete(id);
    if (!tag) {
      return res.status(404).json({ error: "Tag not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { followTag, unfollowTag, createTag, deleteTag };
