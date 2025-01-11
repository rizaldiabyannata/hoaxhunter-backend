const express = require("express");
const router = express.Router();
const {
  addComment,
  replyToComment,
} = require("../controllers/commentControllers");
const { authMiddleware } = require("../middleware/authMiddleware"); // Middleware autentikasi

router.post("/", authMiddleware, addComment);
router.post("/replay", authMiddleware, replyToComment);

module.exports = router;
