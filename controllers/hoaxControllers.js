const Article = require("../models/hoaxModel");

const User = require("../models/userModel");
const Article = require("../models/hoaxModel");

const createArticle = async (req, res) => {
  try {
    const { title, description, tags } = req.body;
    const userId = req.user.id; // Asumsi ID pengguna berasal dari middleware autentikasi

    // Validasi input
    if (!title || !description || !tags || tags.length === 0) {
      return res
        .status(400)
        .json({ error: "Title, description, and tags are required" });
    }

    // Validasi file
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Files are required" });
    }

    // Cek apakah ada file yang gagal di-upload
    const invalidFiles = req.files.filter((file) => !file.filename);
    if (invalidFiles.length > 0) {
      return res
        .status(400)
        .json({ error: "Some files failed to upload", invalidFiles });
    }

    // Proses file untuk disimpan di database
    const files = req.files.map((file) => ({
      url: `${req.protocol}://${req.get("host")}/uploads/${file.filename}`,
      fileType: file.mimetype,
    }));

    // Simpan artikel ke database
    const article = new Article({
      title,
      description,
      tags,
      files,
      createdBy: userId,
    });

    await article.save();

    // Kirim notifikasi ke pengguna yang mengikuti tag
    const users = await User.find({ followedTags: { $in: tags } });

    users.forEach(async (user) => {
      user.notifications.push({
        message: `New article titled "${title}" was posted in tags you follow.`,
      });
      await user.save();
    });

    res.status(201).json({ message: "Article created successfully", article });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createArticle };
