const express = require("express");
const router = express.Router();
const {
  addComment,
  replyToComment,
} = require("../controllers/commentControllers");
const { authMiddleware } = require("../middleware/authMiddleware"); // Middleware autentikasi
const { singleUpload } = require("../middleware/uploadMiddleware");

router.post("/", authMiddleware, singleUpload, addComment);
router.post("/replay", authMiddleware, singleUpload, replyToComment);

module.exports = router;
