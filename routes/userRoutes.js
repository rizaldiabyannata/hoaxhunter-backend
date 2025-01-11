const express = require("express");
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  createUser,
} = require("../controllers/userControllers");

const {
  authMiddleware,
  adminMiddleware,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getAllUsers);
router.get("/:id", adminMiddleware, getUserById);
router.post("/create", adminMiddleware, createUser);
router.put("/update/:id", adminMiddleware, updateUser);
router.delete("/delete/:id", adminMiddleware, deleteUser);

module.exports = router;
