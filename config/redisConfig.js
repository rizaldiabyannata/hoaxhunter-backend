import Redis from "ioredis";

const redis = new Redis({
  host: "127.0.0.1", // Ganti dengan alamat Redis jika di-host secara eksternal
  port: 6379,
});

redis.on("connect", () => console.log("Redis Connected"));
redis.on("error", (err) => console.error("Redis Error:", err));

export default redis;
