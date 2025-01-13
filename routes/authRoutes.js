const express = require("express");
const { register, login, logout } = require("../controllers/authControllers");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", authMiddleware, logout);

module.exports = router;
