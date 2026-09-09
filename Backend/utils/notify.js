const Notification = require("../models/notification");
const logger = require("./logger");

async function notifyUser(userId, msg, { type = "manual", link = null } = {}) {
  if (!userId) return;
  try {
    await Notification.create({ user: userId, msg, type, link });
  } catch (err) {
    logger.error("Failed to create notification:", err);
  }
}

module.exports = notifyUser;