const express = require("express");
const {
  createNotification,
  getAllNotifications,
  deleteNotification,
} = require("../controllers/notificationControllers");
const { authMiddleware } = require("../middleware/authMiddleware"); // Middleware autentikasi

const router = express.Router();

// Rute untuk membuat notifikasi
router.post("/", authMiddleware, createNotification);

// Rute untuk mendapatkan semua notifikasi
router.get("/", authMiddleware, getAllNotifications);

// Rute untuk menghapus notifikasi berdasarkan ID
router.delete("/delete", authMiddleware, deleteNotification);

module.exports = router;
