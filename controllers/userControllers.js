const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const redisClient = require("../config/redisConfig");
const slugify = require("slugify");

const getAllUsers = async (req, res) => {
  const { page = 1 } = req.query;
  const limit = 10;
  const skip = (page - 1) * limit;

  try {
    const users = await User.find().skip(skip).limit(limit);
    const totalUsers = await User.countDocuments();
    const totalPages = Math.ceil(totalUsers / limit);

    res.status(200).json({
      users,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving users", error });
  }
};

const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const cachedUser = await redisClient.get(`user:${id}`);
    if (cachedUser) {
      return res.json(JSON.parse(cachedUser));
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await redisClient.set(`user:${id}`, JSON.stringify(user), "EX", 60);

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving user", error });
  }
};

const getUserBySlug = async (req, res) => {
  const { slug } = req.params;
  try {
    const cachedUser = await redisClient.get(`user:slug:${slug}`);
    if (cachedUser) {
      return res.json(JSON.parse(cachedUser));
    }

    const user = await User.findOne({ slug });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await redisClient.set(`user:slug:${slug}`, JSON.stringify(user), "EX", 60);

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving user", error });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, password, rank } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.username = username || user.username;
    user.email = email || user.email;
    user.rank = rank || user.rank;
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }
    await user.save();
    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating user", error });
  }
};

const updateProfile = async (req, res) => {
  const { id } = req.user; // Ambil ID user dari token autentikasi
  const { username, oldPassword, newPassword } = req.body;

  try {
    // Cari user berdasarkan ID
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Mencegah pengguna mengubah email
    if (req.body.email && req.body.email !== user.email) {
      return res.status(403).json({ message: "Changing email is not allowed" });
    }

    // Update username jika ada perubahan
    if (username && username !== user.username) {
      // Validasi username agar tidak mengandung simbol
      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      if (!usernameRegex.test(username)) {
        return res.status(400).json({
          status: "error",
          message:
            "Username can only contain letters, numbers, and underscores",
        });
      }

      user.username = username;
      user.slug = slugify(username, {
        lower: true,
        strict: true,
        remove: /[*+~.()'"!:@]/g,
      });
    }

    // Memastikan password lama sesuai sebelum mengubah password
    if (newPassword) {
      if (!oldPassword) {
        return res.status(400).json({ message: "Old password is required" });
      }

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Old password is incorrect" });
      }

      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating user", error });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error });
  }
};

const createUser = async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: role || "user",
    });
    await newUser.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error creating user", error });
  }
};

const getUserHistory = async (req, res) => {
  try {
    const { id } = req.params;

    // Periksa apakah data sudah ada di Redis
    const cachedHistory = await redisClient.get(`user:history:${id}`);
    if (cachedHistory) {
      return res.json({ history: JSON.parse(cachedHistory) });
    }

    // Ambil data dari database jika belum ada di cache
    const user = await User.findById(id).select("history");
    if (!user) return res.status(404).json({ error: "User not found" });

    // Simpan ke Redis dengan TTL (Time-To-Live) 60 detik
    await redisClient.set(`user:history:${id}`, JSON.stringify(user.history), {
      EX: 60, // Expire dalam 60 detik
    });

    res.status(200).json({ history: user.history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getArticleByUsers = async (req, res) => {
  try {
    const { id } = req.user;
    logger.info(`Fetching articles for user: ${id}`);

    // Cek cache Redis
    const cachedArticles = await redisClient.get(`articles:user:${id}`);

    if (cachedArticles) {
      logger.info(`Cache hit for user ${id}`);
      return res.status(200).json({ articles: JSON.parse(cachedArticles) });
    }

    // Ambil data dari database jika tidak ada di cache
    const articles = await Article.find({ createdBy: id }).populate(
      "createdBy",
      "name email"
    );

    if (!articles.length) {
      logger.warn(`No articles found for user ${id}`);
      return res.status(404).json({ error: "No articles found" });
    }

    // Simpan hasil query ke Redis dengan TTL 1 jam
    await redisClient.set(
      `articles:user:${id}`,
      JSON.stringify(articles),
      "EX",
      3600
    );

    logger.info(`Fetched ${articles.length} articles for user ${id}`);
    res.status(200).json({ articles });
  } catch (error) {
    logger.error(`Error fetching articles for user: ${error.message}`, {
      stack: error.stack,
    });
    res.status(500).json({ error: "Failed to fetch articles" });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  getUserBySlug,
  updateUser,
  deleteUser,
  createUser,
  getUserHistory,
  updateProfile,
};
