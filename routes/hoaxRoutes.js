const express = require("express");
const router = express.Router();
const {
  createArticle,
  getAllArticles,
  getArticleById,
  getArticleBySlug,
  getArticlesByFollowedTags,
  getArticleByUser,
} = require("../controllers/hoaxControllers");
const { multiUpload } = require("../middleware/uploadMiddleware");
const { authMiddleware } = require("../middleware/authMiddleware");

// Route untuk membuat artikel
router.post("/", authMiddleware, multiUpload, createArticle);
router.get("/all", authMiddleware, getAllArticles);
router.get("/:id", authMiddleware, getArticleById);
router.get("/:slug", authMiddleware, getArticleBySlug);
router.get("/followed-tags", authMiddleware, getArticlesByFollowedTags);
router.get("/user/:id", authMiddleware, getArticleByUser);

module.exports = router;
