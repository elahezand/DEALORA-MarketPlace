const service = require("../services/notification");

// GET ALL — for the logged-in caller (admin dashboard bell, or a regular
exports.getAll = async (req, res, next) => {
  try {
    const data = await service.getAll(req.user._id);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

// GET ONE
exports.get = async (req, res, next) => {
  try {
    const data = await service.get(req.params.id, req.user._id);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

// CREATE — admin-to-admin only. `admin` (the recipient) comes from
exports.post = async (req, res, next) => {
  try {
    const data = await service.create(req.parsed.data);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

// SEEN — scoped to the caller, so you can only mark your own as seen.
exports.seen = async (req, res, next) => {
  try {
    const data = await service.markSeen(req.params.id, req.user._id);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

// DELETE — scoped to the caller, so you can only delete your own.
exports.remove = async (req, res, next) => {
  try {
    await service.remove(req.params.id, req.user._id);
    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (err) {
    next(err);
  }
};