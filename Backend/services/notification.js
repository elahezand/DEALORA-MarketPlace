const Notification = require("../models/notification");
const User = require("../models/user");
const mongoose = require("mongoose");
const AppError = require("../utils/AppError");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// GET ALL (for a specific recipient — admin viewing their own, or a regular
exports.getAll = async (userId) => {
  return await Notification.find({ user: userId })
    .sort({ createdAt: -1 })
    .lean();
};

// GET ONE — scoped to the caller, same reasoning as markSeen/remove.
exports.get = async (id, ownerId) => {
  if (!isValidId(id)) {
    throw new AppError(400, "Invalid id");
  }

  const notification = await Notification.findOne({ _id: id, user: ownerId }).lean();

  if (!notification) {
    throw new AppError(404, "Notification not found");
  }

  return notification;
};

// CREATE — sends a notification to the admin identified by `data.admin`
exports.create = async (data) => {
  const recipient = await User.findById(data.user).select("_id role").lean();
  if (!recipient) {
    throw new AppError(404, "Admin not found");}

  if (!recipient.role?.includes("ADMIN")) {
    throw new AppError(400, "That user is not an admin");
  }
  return await Notification.create({ msg: data.msg, user: recipient._id });
};

// MARK AS SEEN
exports.markSeen = async (id, ownerId) => {
  if (!isValidId(id)) {
    throw new AppError(400, "Invalid id");
  }

  const updated = await Notification.findOneAndUpdate(
    { _id: id, user: ownerId },
    { $set: { see: 1 } },
    { new: true, runValidators: true }
  );

  if (!updated) {
    throw new AppError(404, "Notification not found");
  }

  return updated;
};

// DELETE — same ownership scoping as markSeen above.
exports.remove = async (id, ownerId) => {
  if (!isValidId(id)) {
    throw new AppError(400, "Invalid id");
  }

  const deleted = await Notification.findOneAndDelete({ _id: id, user: ownerId });
  if (!deleted) {
    throw new AppError(404, "Notification not found");
  }

  return true;
};