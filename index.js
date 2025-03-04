const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const logger = require("./utils/logger");
const requestLogger = require("./middleware/loggerMiddleware");
const http = require("http");
const { Server } = require("socket.io");

require("dotenv").config();

const routes = require("./routes/index");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    headers: ["Content-Type", "Authorization"],
    maxAge: 3600,
    credentials: true,
  })
);
app.set("trust proxy", 1);
app.use(requestLogger);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
});

app.use(limiter);

// Endpoint Status (REST API)
app.get("/status", (req, res) => {
  const uptime = getUptime();
  res.status(200).json({ status: "ok", uptime });
});

// Fungsi untuk mendapatkan uptime server dalam format yang lebih mudah dibaca
function getUptime() {
  const seconds = Math.floor(process.uptime());
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${days > 0 ? days + "d " : ""}${hours > 0 ? hours + "h " : ""}${
    minutes > 0 ? minutes + "m " : ""
  }${secs}s`;
}

// Setup Socket.io
io.on("connection", (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // Kirim uptime setiap 5 detik ke klien
  const interval = setInterval(() => {
    socket.emit("server_status", { status: "ok", uptime: getUptime() });
  }, 5000);

  // Jika klien disconnect, hentikan interval
  socket.on("disconnect", () => {
    logger.info(`Client disconnected: ${socket.id}`);
    clearInterval(interval);
  });
});

// Logging saat memuat routes
logger.info("Memuat routes...");
app.use("/api", routes);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => logger.info("Connected to MongoDB"))
  .catch((err) => logger.error("MongoDB connection error:", err));

// Start Server dengan Socket.io
server.listen(PORT, () => logger.info(`Server running on port: ${PORT}`));
