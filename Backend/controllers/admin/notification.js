const adminNotificationService = require("../../services/admin/notification");

const post = async (req, res, next) => {
  try {
    const data = await adminNotificationService.create(req.parsed.data);
    res.status(201).json({ success: true, message: "Notification created", data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  post,
};
