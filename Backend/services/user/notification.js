const Notification = require("../../models/notification");
const mongoose = require("mongoose");
const AppError = require("../../utils/AppError");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const getAll = async (userId) => {
  return await Notification.find({ user: userId })
    .sort({ createdAt: -1 })
    .lean();
};

const get = async (id, ownerId) => {
  if (!isValidId(id)) {
    throw new AppError(400, "Invalid id");
  }

  const notification = await Notification.findOne({ _id: id, user: ownerId }).lean();

  if (!notification) {
    throw new AppError(404, "Notification not found");
  }

  return notification;
};

const markSeen = async (id, ownerId) => {
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

const remove = async (id, ownerId) => {
  if (!isValidId(id)) {
    throw new AppError(400, "Invalid id");
  }

  const deleted = await Notification.findOneAndDelete({ _id: id, user: ownerId });
  if (!deleted) {
    throw new AppError(404, "Notification not found");
  }

  return true;
};

module.exports = {
  getAll,
  get,
  markSeen,
  remove,
};
