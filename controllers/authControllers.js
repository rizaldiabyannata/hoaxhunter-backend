const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Tag = require("../models/tagModel");
const logActivity = require("../utils/logService");
const sendOTPEmail = require("../utils/emailService");
const randomstring = require("randomstring");
const redisClient = require("../config/redisConfig");
const axios = require("axios");

const register = async (req, res) => {
  const { username, email, password } = req.body;
  const userIP = req.headers["x-forwarded-for"] || req.ip; // Ambil IP user

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

    const otp = randomstring.generate({ length: 6, charset: "numeric" });
    const hashedOtp = await bcrypt.hash(otp, 10);
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 menit

    // 🔹 Dapatkan Negara Berdasarkan IP
    let countryName = null;
    let countryTag = null;
    try {
      const response = await axios.get(
        `https://ipinfo.io/${userIP}/json?token=${process.env.IPINFO_TOKEN}`
      );
      const data = await response.data;
      if (data.country) {
        countryName = data.country;
      }
    } catch (error) {
      console.error("Error fetching country:", error);
    }

    // 🔹 Periksa apakah tag "all" sudah ada
    let allTag = await Tag.findOne({ name: "all" });
    if (!allTag) {
      allTag = new Tag({ name: "all" });
      await allTag.save();
    }

    if (countryName) {
      countryTag = await Tag.findOne({ name: countryName });
      if (!countryTag) {
        countryTag = new Tag({ name: countryName });
        await countryTag.save();
      }
    }

    const followedTags = [allTag._id];
    if (countryTag) {
      followedTags.push(countryTag._id);
    }

    const user = new User({
      username,
      email,
      password: hashedPassword,
      followedTags: followedTags,
      isVerified: false,
      otp: hashedOtp,
      otpExpires,
    });

    await user.save();
    await sendOTPEmail(email, username, otp);

    // 🔹 Log aktivitas
    await logActivity(user._id, null, "register", [], null);

    res.status(201).json({
      message: "User registered successfully",
      country: countryName,
      followedTags: [allTag.name, countryTag ? countryTag.name : null].filter(
        Boolean
      ),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Pastikan Redis terhubung sebelum digunakan
    if (!redisClient.isOpen) await redisClient.connect();

    // Cek cache Redis untuk session user
    const cachedSession = await redisClient.get(`session:${email}`);
    if (cachedSession) {
      const cachedUser = JSON.parse(cachedSession);

      // Buat ulang JWT Token
      const token = jwt.sign(
        {
          id: cachedUser._id,
          role: cachedUser.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      // Set cookie meskipun data berasal dari Redis
      res.cookie("authToken", token, {
        httpOnly: true,
        secure: false, // Set ke `true` jika menggunakan HTTPS
        maxAge: 60 * 60 * 1000,
        sameSite: "strict",
      });

      return res.json({
        message: "Login successful (cached)",
        user: cachedUser,
        token,
      });
    }

    // Periksa apakah email terdaftar
    const user = await User.findOne({ email }).lean();
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Periksa apakah akun sudah diverifikasi
    if (!user.isVerified) {
      return res
        .status(400)
        .json({ message: "Please verify your account before logging in" });
    }

    // Periksa password
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
      { expiresIn: "1h" }
    );

    // Simpan session di Redis dengan TTL 1 jam
    await redisClient.set(`session:${email}`, JSON.stringify(user), {
      EX: 3600, // 1 jam
    });

    // Simpan token di cookie
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: false,
      maxAge: 60 * 60 * 1000,
      sameSite: "strict",
    });

    res.status(200).json({ message: "Login successful", user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const logout = async (req, res) => {
  if (!redisClient.isOpen) await redisClient.connect();

  await redisClient.del(`session:${req.body.email}`); // Pakai req.body.email

  res.clearCookie("authToken", {
    httpOnly: true,
    secure: false,
    sameSite: "strict",
  });

  await logActivity(req.user.id, null, "logout", [], null);

  res.status(200).json({ message: "Logout successful" });
};

const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Email tidak ditemukan" });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: "Akun sudah diverifikasi" });
    }

    // Cek apakah OTP benar dan belum kadaluarsa
    const isOtpValid = await bcrypt.compare(otp, user.otp);
    if (!isOtpValid || user.otpExpires < Date.now()) {
      return res
        .status(400)
        .json({ error: "OTP salah atau sudah kedaluwarsa" });
    }

    // Jika OTP benar, set akun sebagai terverifikasi
    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.status(200).json({ message: "Verifikasi berhasil, silakan login" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const resendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Email tidak ditemukan" });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: "Akun sudah diverifikasi" });
    }

    // Generate OTP baru
    const otp = randomstring.generate({ length: 6, charset: "numeric" });
    const hashedOtp = await bcrypt.hash(otp, 10);
    user.otp = hashedOtp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 menit
    await user.save();

    // Kirim OTP baru
    await sendOTPEmail(email, user.username, otp);

    res.status(200).json({ message: "OTP baru telah dikirim ke email" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { register, login, logout, verifyOTP, resendOTP };
