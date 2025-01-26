const express = require("express");
const router = express.Router();
const {
  createArticle,
  getAllArticles,
  getArticleById,
} = require("../controllers/hoaxControllers");
const { multiUpload } = require("../middleware/uploadMiddleware");
const { authMiddleware } = require("../middleware/authMiddleware");

// Route untuk membuat artikel
router.post("/", authMiddleware, multiUpload, createArticle);
router.get("/all", getAllArticles);
router.get("/:id", authMiddleware, getArticleById);

module.exports = router;
