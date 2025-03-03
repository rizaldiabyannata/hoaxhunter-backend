const redis = require("redis");
const logger = require("../utils/logger");

require("dotenv").config();

const REDIS_HOST =
  process.env.NODE_ENV === "development" ? "127.0.0.1" : "redis";

const redisClient = redis.createClient({
  socket: { host: REDIS_HOST, port: 6379 },
});

// Logging saat mencoba koneksi
logger.info("🔄 Mencoba menghubungkan ke Redis...");

// Event untuk koneksi sukses
redisClient.on("connect", () => logger.info("✅ Redis Connected"));

// Event untuk error Redis
redisClient.on("error", (err) => logger.error("❌ Redis Error:", err));

(async () => {
  try {
    await redisClient.connect();
    logger.info("🚀 Redis client siap digunakan.");
  } catch (err) {
    logger.error("❌ Gagal menghubungkan ke Redis:", err);
  }
})();

module.exports = redisClient;
