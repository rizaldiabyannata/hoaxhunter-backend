const express = require("express");
const router = express.Router();
const {
  addComment,
  replyToComment,
  getComments,
  deleteComment,
} = require("../controllers/commentControllers");
const { authMiddleware } = require("../middleware/authMiddleware"); // Middleware autentikasi
const { singleUpload } = require("../middleware/uploadMiddleware");

router.post("/", authMiddleware, singleUpload, addComment);
router.post("/replay", authMiddleware, singleUpload, replyToComment);
router.get("/:id", authMiddleware, getComments);
router.delete("/:id", authMiddleware, deleteComment);

module.exports = router;
