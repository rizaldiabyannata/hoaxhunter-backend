const express = require("express");
const router = express.Router();
const { createArticle } = require("../controllers/hoaxControllers");
const { multiUpload } = require("../middleware/uploadMiddleware");
const { authMiddleware } = require("../middleware/authMiddleware");

// Route untuk membuat artikel
router.post("/", authMiddleware, multiUpload, createArticle);

module.exports = router;
