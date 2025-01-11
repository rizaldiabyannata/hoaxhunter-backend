const express = require("express");
const router = express.Router();
const { addComment } = require("../controllers/commentControllers");
const { authMiddleware } = require("../middleware/authMiddleware"); // Middleware autentikasi

router.post("/", authMiddleware, addComment);

module.exports = router;
