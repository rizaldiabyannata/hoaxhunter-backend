const Log = require("../models/logModel");

const logActivity = async (userId, articleId, action, tags, details = "") => {
  try {
    const log = new Log({
      userId,
      articleId,
      action,
      tags,
      details,
    });
    await log.save();
  } catch (error) {
    console.error("Failed to log activity:", error.message);
  }
};

module.exports = logActivity;
