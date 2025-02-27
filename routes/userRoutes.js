const express = require("express");
const {
  getAllUsers,
  getUserById,
  getUserBySlug,
  updateUser,
  deleteUser,
  createUser,
  getUserHistory,
} = require("../controllers/userControllers");

const {
  authMiddleware,
  adminMiddleware,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getAllUsers);
router.get("/:id", adminMiddleware, getUserById);
router.get("/:slug", getUserBySlug);
router.post("/create", adminMiddleware, createUser);
router.put("/update/:id", adminMiddleware, updateUser);
router.delete("/delete/:id", adminMiddleware, deleteUser);
router.get("/history", authMiddleware, getUserHistory);

module.exports = router;
