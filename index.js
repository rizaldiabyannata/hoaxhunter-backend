const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

require("dotenv").config();

const routes = require("./routes/index");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    headers: ["Content-Type", "Authorization"],
    maxAge: 3600, // 1 hour
  })
);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api", routes);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Start Server
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
