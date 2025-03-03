const Article = require("../models/hoaxModel");
const User = require("../models/userModel");
const { addHistory } = require("../utils/history");
const redisClient = require("../config/redisConfig");

const fs = require("fs");
const path = require("path");

const slugify = require("slugify");

const logger = require("../utils/logger");

const createArticle = async (req, res) => {
  try {
    const { title, description, tags } = req.body;
    const userId = req.user.id; // Asumsi ID pengguna berasal dari middleware autentikasi

    logger.info(`User ${userId} is creating an article with title: "${title}"`);

    // Validasi input
    if (!title || !description) {
      logger.warn(
        "Validation failed: Title, description, and tags are required"
      );
      throw new Error("Title, description, and tags are required");
    }

    // Validasi file
    if (!req.files || req.files.length === 0) {
      logger.warn("Validation failed: Files are required");
      throw new Error("Files are required");
    }

    // Cek apakah ada file yang gagal di-upload
    const invalidFiles = req.files.filter((file) => !file.filename);
    if (invalidFiles.length > 0) {
      logger.warn("Validation failed: Some files failed to upload");
      throw new Error("Some files failed to upload");
    }

    // Proses file untuk disimpan di database
    const files = req.files.map((file) => ({
      url: `${req.protocol}://${req.get("host")}/uploads/${file.filename}`,
      fileType: file.mimetype,
    }));

    // Buat slug dari judul
    const slug = slugify(title, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });

    // Simpan artikel ke database
    const article = new Article({
      title,
      slug,
      description,
      tags,
      files,
      createdBy: userId,
    });

    await article.save();
    logger.info(
      `Article "${title}" (ID: ${article._id}) created successfully by user ${userId}`
    );

    // Kirim notifikasi ke pengguna yang mengikuti tag
    const users = await User.find({ followedTags: { $in: tags } });

    for (const user of users) {
      user.notifications.push({
        message: `New article titled "${title}" was posted in tags you follow.`,
      });
      await user.save();
    }
    logger.info(`Notifications sent to users following tags: ${tags}`);

    // Tambahkan ke dalam history pengguna
    await addHistory(
      userId,
      "upload_article",
      article._id,
      `Uploaded article: ${title}`
    );

    logger.info(
      `History entry added for user ${userId} - Uploaded article: ${title}`
    );

    res.status(201).json({ message: "Article created successfully", article });
  } catch (error) {
    logger.error(`Error creating article: ${error.message}`, {
      stack: error.stack,
    });

    // Hapus semua file yang telah terunggah jika terjadi error
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        if (file.filename) {
          const filePath = path.join(__dirname, "../uploads/", file.filename);
          fs.unlink(filePath, (err) => {
            if (err) {
              logger.error(`Failed to delete file: ${filePath}`, {
                stack: err.stack,
              });
            } else {
              logger.warn(`File deleted: ${filePath}`);
            }
          });
        }
      });
    }

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

const getAllArticles = async (req, res) => {
  try {
    const articles = await Article.find().populate("createdBy", "name email");

    res.status(200).json({ articles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch articles" });
  }
};

const getArticleById = async (req, res) => {
  try {
    const { id } = req.params;

    // Cek apakah data sudah ada di Redis
    const cachedArticle = await redisClient.get(`article:${id}`);

    if (cachedArticle) {
      return res.status(200).json({ article: JSON.parse(cachedArticle) });
    }

    // Jika tidak ada di cache, ambil dari database
    const article = await Article.findById(id).populate(
      "createdBy",
      "name email"
    );

    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    // Simpan ke Redis
    await redisClient.set(`article:${id}`, JSON.stringify(article), "EX", 3600);

    res.status(200).json({ article });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch article" });
  }
};

const getArticleBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    // Cek apakah data sudah ada di Redis
    const cachedArticle = await redisClient.get(`article:slug:${slug}`);

    if (cachedArticle) {
      return res.status(200).json({ article: JSON.parse(cachedArticle) });
    }

    // Jika tidak ada di cache, ambil dari database
    const article = await Article.findOne({ slug }).populate(
      "createdBy",
      "name email"
    );

    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    // Simpan ke Redis
    await redisClient.set(
      `article:slug:${slug}`,
      JSON.stringify(article),
      "EX",
      3600
    );

    res.status(200).json({ article });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch article" });
  }
};

module.exports = {
  createArticle,
  getArticlesByFollowedTags,
  getAllArticles,
  getArticleById,
  getArticleBySlug,
};
