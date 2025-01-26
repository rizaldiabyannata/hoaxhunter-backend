const redis = require("redis");

const redisClient = redis.createClient({
  socket: { host: "127.0.0.1", port: 6379 },
});

redisClient.on("connect", () => console.log("Redis Connected"));
redisClient.on("error", (err) => console.error("Redis Error:", err));

(async () => {
  await redisClient.connect();
})();

module.exports = redisClient;
