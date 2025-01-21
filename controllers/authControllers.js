const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Tag = require("../models/tagModel");
const logActivity = require("../utils/logService");

const register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: "Username, email, and password are required" });
    }

    // Periksa apakah email sudah terdaftar
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Periksa apakah tag "all" sudah ada
    let tag = await Tag.findOne({ name: "all" });
    if (!tag) {
      // Buat tag "all" jika belum ada
      tag = new Tag({ name: "all" });
      await tag.save();
    }

    const tagId = tag._id;

    // Simpan pengguna ke database dan ikuti tag "all"
    const user = new User({
      username,
      email,
      password: hashedPassword,
      followedTags: [tagId],
    });
    await user.save();

    // Log aktivitas
    await logActivity(user._id, null, "register", [], null);

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validasi input
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Periksa apakah email terdaftar
    const user = await User.findOne({ email }).lean();
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h", // Token berlaku selama 1 jam
      }
    );

    // Kirim token dalam cookie
    res.cookie("authToken", token, {
      httpOnly: true, // Tidak bisa diakses oleh JavaScript (meningkatkan keamanan)
      secure: false, // Set true jika menggunakan HTTPS
      maxAge: 60 * 60 * 1000, // Cookie berlaku selama 1 jam
      sameSite: "strict", // Lindungi dari serangan CSRF
    });

    await logActivity(user._id, null, "login", [], null);

    res
      .status(200)
      .json({ message: "Login successful", user: user, token: token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const logout = async (req, res) => {
  res.clearCookie("authToken", {
    httpOnly: true,
    secure: false, // Set true jika menggunakan HTTPS
    sameSite: "strict",
  });

  await logActivity(req.user.id, null, "logout", [], null);

  res.status(200).json({ message: "Logout successful" });
};

module.exports = { register, login, logout };
