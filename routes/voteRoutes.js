const express = require("express");
const router = express.Router();
const { addVote } = require("../controllers/voteControllers");
const { authMiddleware } = require("../middleware/authMiddleware"); // Middleware autentikasi

router.post("/", authMiddleware, addVote);

module.exports = router;
