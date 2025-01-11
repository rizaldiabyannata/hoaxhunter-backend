const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const hoaxRoutes = require("./hoaxRoutes");
const voteRoutes = require("./voteRoutes");
const commentRoutes = require("./commentRoutes");
const tagRoutes = require("./tagRoutes");
const notificationRoutes = require("./notificationRoutes");

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/hoaxes", hoaxRoutes);
router.use("/votes", voteRoutes);
router.use("/comments", commentRoutes);
router.use("/tags", tagRoutes);
router.use("/notifications", notificationRoutes);

module.exports = router;
