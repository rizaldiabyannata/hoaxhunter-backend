const User = require("../models/userModel");
const Tag = require("../models/tagModel");

const createNotification = async (req, res) => {
  try {
    const { message, to } = req.body;

    // Validasi input
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Default target adalah "all" jika `to` tidak diberikan
    const target = to ? to.toLowerCase() : "all";

    let usersToNotify;

    if (target === "all") {
      // Kirim notifikasi ke semua pengguna
      usersToNotify = await User.find({});
    } else {
      // Cari tag berdasarkan nama
      const existingTag = await Tag.findOne({ name: target });
      if (!existingTag) {
        return res.status(404).json({ error: `Tag '${target}' not found` });
      }

      // Cari semua pengguna yang mengikuti tag
      usersToNotify = await User.find({ followedTags: existingTag._id });
    }

    if (!usersToNotify || usersToNotify.length === 0) {
      return res
        .status(404)
        .json({ error: `No users found for the target '${target}'` });
    }

    // Tambahkan notifikasi ke setiap pengguna
    const notification = { message, createdAt: new Date() };
    const updatePromises = usersToNotify.map((user) =>
      User.findByIdAndUpdate(
        user._id,
        { $push: { notifications: notification } }, // Tambahkan notifikasi ke array
        { new: true }
      )
    );

    await Promise.all(updatePromises);

    res.status(201).json({ message: "Notifications sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

const getAllNotifications = async (req, res) => {
  const id = req.user.id;
  try {
    const user = await User.findById(id).populate("notifications"); // Populate notifications
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const notifications = user.notifications.sort(
      (a, b) => b.createdAt - a.createdAt
    );
    res.status(200).json({ notifications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Delete Notification
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.body;
    const id = req.user.id;

    const user = await User.findById(id).populate("notifications"); // Populate notifications
    const notification = user.notifications.id(notificationId);

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    const index = user.notifications.indexOf(notification);
    user.notifications.splice(index, 1);
    await user.save();

    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createNotification,
  getAllNotifications,
  deleteNotification,
};
