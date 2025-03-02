const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Tag = require("../models/tagModel");
const sendOTPEmail = require("../utils/emailService");
const randomstring = require("randomstring");
const redisClient = require("../config/redisConfig");
const axios = require("axios");
const slugify = require("slugify");
const logger = require("../utils/logger");

const register = async (req, res) => {
  const { username, email, password } = req.body;
  const userIP = req.headers["x-forwarded-for"] || req.ip; // Ambil IP user
  const reqCookies = req.cookies;

  try {
    if (reqCookies.authToken) {
      return res.status(400).json({
        status: "error",
        message: "You are already logged in",
      });
    }

    if (!username || !email || !password) {
      logger.warn(`Register failed: Missing fields from IP ${userIP}`);
      return res.status(400).json({
        status: "error",
        message: "Username, email, and password are required",
      });
    }

    // Validasi username agar tidak mengandung simbol
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        status: "error",
        message: "Username can only contain letters, numbers, and underscores",
      });
    }

    // Periksa apakah email sudah terdaftar
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });

    if (existingUser) {
      logger.warn(
        `Register failed: Email (${email}) or Username (${username}) already exists from IP ${userIP}`
      );
      return res.status(400).json({
        status: "error",
        message:
          existingUser.email === email
            ? "Email is already registered"
            : "Username is already taken",
      });
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

    const slug = slugify(username, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });

    const user = new User({
      username: username,
      email: email,
      password: hashedPassword,
      followedTags: followedTags,
      slug: slug,
      isVerified: false,
      otp: hashedOtp,
      otpExpires: otpExpires,
    });

    await user.save();
    await sendOTPEmail(email, username, otp);

    logger.info(`User registered successfully: ${email} from IP ${userIP}`);

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      country: countryName,
      followedTags: [allTag.name, countryTag ? countryTag.name : null].filter(
        Boolean
      ),
    });
  } catch (err) {
    logger.error(`Register failed: ${err.message}`);
    res.status(500).json({ status: "error", message: err.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const reqCookies = req.cookies;

  try {
    if (reqCookies.authToken) {
      return res.status(400).json({
        status: "error",
        message: "You are already logged in",
      });
    }

    if (!email || !password) {
      logger.warn(`Login failed: Missing credentials for email ${email}`);
      return res
        .status(400)
        .json({ status: "error", message: "Email and password are required" });
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
      logger.warn(`Login failed: Email not found (${email})`);
      return res
        .status(400)
        .json({ status: "error", message: "Invalid email or password" });
    }

    // Periksa apakah akun sudah diverifikasi
    if (!user.isVerified) {
      logger.warn(`Login failed: Unverified account (${email})`);
      return res.status(400).json({
        status: "error",
        message: "Please verify your account before logging in",
      });
    }

    // Periksa password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.warn(
        `Login failed: Incorrect credential for account ${user.username}`
      );
      return res
        .status(400)
        .json({ status: "success", message: "Invalid email or password" });
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

    logger.info(`Login successful: ${email}`);

    res
      .status(200)
      .json({ status: "success", message: "Login successful", user, token });
  } catch (err) {
    logger.error(`Login failed: ${err.message}`);
    res.status(500).json({ status: "error", message: err.message });
  }
};

const logout = async (req, res) => {
  try {
    if (!redisClient.isOpen) await redisClient.connect();

    await redisClient.del(`session:${req.body.email}`);

    res.clearCookie("authToken", {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });

    logger.info(`Logout successful: ${req.body.email}`);

    res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    logger.error(`Logout failed: ${err.message}`);
    res.status(500).json({ status: "error", message: err.message });
  }
};

const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn(`OTP verification failed: Email not found (${email})`);
      return res
        .status(400)
        .json({ status: "error", message: "Email tidak ditemukan" });
    }

    if (user.isVerified) {
      return res
        .status(400)
        .json({ status: "error", message: "Akun sudah diverifikasi" });
    }

    // Cek apakah OTP benar dan belum kadaluarsa
    const isOtpValid = await bcrypt.compare(otp, user.otp);
    if (!isOtpValid || user.otpExpires < Date.now()) {
      logger.warn(`OTP verification failed: Invalid OTP for email (${email})`);
      return res
        .status(400)
        .json({ status: "error", message: "OTP salah atau sudah kedaluwarsa" });
    }

    // Jika OTP benar, set akun sebagai terverifikasi
    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    logger.info(`OTP verified successfully for account ${user.username}`);

    res.status(200).json({
      status: "success",
      message: "Verifikasi berhasil, silakan login",
    });
  } catch (err) {
    logger.error(`OTP verification failed: ${err.message}`);
    res.status(500).json({ status: "error", message: err.message });
  }
};

const resendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn(`OTP verification failed: Email not found (${email})`);
      return res
        .status(400)
        .json({ status: "error", message: "Email tidak ditemukan" });
    }

    if (user.isVerified) {
      logger.warn(
        `OTP verification failed: Account already (${user.username}) verified`
      );
      return res
        .status(400)
        .json({ status: "error", message: "Akun sudah diverifikasi" });
    }

    // Generate OTP baru
    const otp = randomstring.generate({ length: 6, charset: "numeric" });
    const hashedOtp = await bcrypt.hash(otp, 10);
    user.otp = hashedOtp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 menit
    await user.save();

    // Kirim OTP baru
    await sendOTPEmail(email, user.username, otp);

    logger.info(`OTP token successfully resend for account ${user.username}`);

    res
      .status(200)
      .json({ status: "success", message: "OTP baru telah dikirim ke email" });
  } catch (err) {
    logger.error(`Resend OTP failed: ${err.message}`);
    res.status(500).json({ status: "error", message: err.message });
  }
};

module.exports = { register, login, logout, verifyOTP, resendOTP };
