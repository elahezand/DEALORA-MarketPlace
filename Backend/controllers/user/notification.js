const userNotificationService = require("../../services/user/notification");

const getAll = async (req, res, next) => {
  try {
    const data = await userNotificationService.getAll(req.user._id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const get = async (req, res, next) => {
  try {
    const data = await userNotificationService.get(req.params.id, req.user._id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const seen = async (req, res, next) => {
  try {
    const data = await userNotificationService.markSeen(req.params.id, req.user._id);
    res.status(200).json({ success: true, message: "Marked as seen", data });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await userNotificationService.remove(req.params.id, req.user._id);
    res.status(200).json({ success: true, message: "Notification deleted successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAll,
  get,
  seen,
  remove,
};
