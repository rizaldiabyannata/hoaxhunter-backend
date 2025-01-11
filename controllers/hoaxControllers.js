const Article = require("../models/hoaxModel");
const User = require("../models/userModel");

const createArticle = async (req, res) => {
  try {
    const { title, description, tags } = req.body;
    const userId = req.user.id; // Asumsi ID pengguna berasal dari middleware autentikasi

    // Validasi input
    if (!title || !description) {
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

const getArticlesByFollowedTags = async (req, res) => {
  try {
    const userId = req.user.id;

    // Ambil tag yang diikuti pengguna
    const user = await User.findById(userId).populate("followedTags");
    const followedTags = user.followedTags.map((tag) => tag._id);

    // Cari artikel berdasarkan tag yang diikuti
    const articles = await Article.find({ tags: { $in: followedTags } });

    res.status(200).json({ articles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createArticle, getArticlesByFollowedTags };
