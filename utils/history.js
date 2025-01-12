const User = require("../models/userModel");

const addHistory = async (userId, action, targetId, details = "") => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    user.history.push({ action, targetId, details });
    await user.save();

    console.log("History added successfully");
  } catch (error) {
    console.error("Failed to add history:", error.message);
  }
};

module.exports = { addHistory };
