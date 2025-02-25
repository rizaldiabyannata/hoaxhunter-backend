const express = require("express");
const {
  followTag,
  unfollowTag,
  createTag,
  deleteTag,
  editTag,
} = require("../controllers/tagControllers");
const {
  authMiddleware,
  adminMiddleware,
} = require("../middleware/authMiddleware"); // Middleware autentikasi
const router = express.Router();

// Endpoint untuk mengikuti atau berhenti mengikuti tag
router.post("/follow", authMiddleware, followTag);
router.post("/unfollow", authMiddleware, unfollowTag);
router.post("/", adminMiddleware, createTag);
router.put("/:id", adminMiddleware, editTag);
router.delete("/:id", adminMiddleware, deleteTag);

module.exports = router;
