const service = require("../services/notification");

// GET ALL
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
    const data = await service.get(req.params.id);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

// CREATE
exports.post = async (req, res, next) => {
  try {
    const data = await service.create(req.parsed.data);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

// SEEN
exports.seen = async (req, res, next) => {
  try {
    const data = await service.markSeen(req.params.id);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

// DELETE
exports.remove = async (req, res, next) => {
  try {
    await service.remove(req.params.id);
    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (err) {
    next(err);
  }
};