const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const logger = require("./utils/logger");

const requestLogger = require("./middleware/loggerMiddleware");

require("dotenv").config();

const routes = require("./routes/index");

const app = express();
const PORT = process.env.PORT || 3000;

// Logging awal
logger.info("=== Aplikasi Sedang Dimulai ===");

try {
  // Middleware
  logger.info("Mengaktifkan middleware...");
  app.use(helmet());
  app.use(express.json());
  app.use(cookieParser());
  app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
      headers: ["Content-Type", "Authorization"],
      maxAge: 3600, // 1 hour
      credentials: true,
    })
  );

  app.set("trust proxy", 1); // Untuk 1 level proxy (misal: Cloudflare, nginx, dll.)
  app.use(requestLogger);

  app.use("/uploads", express.static(path.join(__dirname, "uploads")));

  const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 menit
    max: 100, // Maksimal 100 request per menit
  });

  app.use(limiter);

  // Status endpoint
  app.get("/status", (req, res) => {
    const seconds = Math.floor(process.uptime());
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const uptime = `${days > 0 ? days + "d " : ""}${
      hours > 0 ? hours + "h " : ""
    }${minutes > 0 ? minutes + "m " : ""}${secs}s`;

    res.status(200).json({ status: "ok", uptime });
  });

  // Logging saat memuat routes
  logger.info("Memuat routes...");
  app.use("/api", routes);

  // MongoDB Connection
  logger.info("Menghubungkan ke MongoDB...");
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => logger.info("✅ Connected to MongoDB"))
    .catch((err) => logger.error("❌ MongoDB connection error:", err));

  // Start Server
  app.listen(PORT, () => logger.info(`🚀 Server running on port: ${PORT}`));
} catch (err) {
  logger.error("❌ Aplikasi gagal dijalankan:", err);
}
