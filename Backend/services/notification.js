const Notification = require("../models/notification");
const mongoose = require("mongoose");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// GET ALL
exports.getAll = async (userId) => {
  return await Notification.find({ admin: userId })
    .sort({ createdAt: -1 })
    .lean();
};

// GET ONE
exports.get = async (id) => {
  if (!isValidId(id)) {
    throw { status: 400, message: "Invalid id" };
  }

  const notification = await Notification.findById(id)
    .populate("admin", "name email")
    .lean();

  if (!notification) {
    throw { status: 404, message: "Notification not found" };
  }

  return notification;
};

// CREATE
exports.create = async (data) => {
  return await Notification.create(data);
};

// MARK AS SEEN
exports.markSeen = async (id) => {
  if (!isValidId(id)) {
    throw { status: 400, message: "Invalid id" };
  }

  const updated = await Notification.findByIdAndUpdate(
    id,
    { $set: { see: 1 } },
    { new: true, runValidators: true }
  );

  if (!updated) {
    throw { status: 404, message: "Notification not found" };
  }

  return updated;
};

// DELETE
exports.remove = async (id) => {
  if (!isValidId(id)) {
    throw { status: 400, message: "Invalid id" };
  }

  const deleted = await Notification.findByIdAndDelete(id);

  if (!deleted) {
    throw { status: 404, message: "Notification not found" };
  }

  return true;
};