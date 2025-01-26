const jwt = require("jsonwebtoken");
const redis = require("../config/redisConfig");

const authMiddleware = async (req, res, next) => {
  const token = req.cookies.authToken;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    const cachedUser = await redis.get(`session:${decoded.id}`);

    if (cachedUser) {
      req.user = JSON.parse(cachedUser);
      return next();
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

const adminMiddleware = async (req, res, next) => {
  const token = req.cookies.authToken;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Cek session di Redis
    const cachedUser = await Redis.get(`session:${decoded.id}`);

    if (cachedUser) {
      req.user = JSON.parse(cachedUser);
    } else {
      return res
        .status(401)
        .json({ message: "Session expired, please login again" });
    }

    // Pastikan hanya admin yang bisa lanjut
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admins only" });
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = { authMiddleware, adminMiddleware };
