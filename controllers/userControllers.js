const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const redisClient = require("../config/redisConfig");

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
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
    const { userId } = req.params;

    // Periksa apakah data sudah ada di Redis
    const cachedHistory = await redisClient.get(`user:history:${userId}`);
    if (cachedHistory) {
      return res.json({ history: JSON.parse(cachedHistory) });
    }

    // Ambil data dari database jika belum ada di cache
    const user = await User.findById(userId).select("history");
    if (!user) return res.status(404).json({ error: "User not found" });

    // Simpan ke Redis dengan TTL (Time-To-Live) 60 detik
    await redisClient.set(
      `user:history:${userId}`,
      JSON.stringify(user.history),
      {
        EX: 60, // Expire dalam 60 detik
      }
    );

    res.status(200).json({ history: user.history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  createUser,
  getUserHistory,
};
