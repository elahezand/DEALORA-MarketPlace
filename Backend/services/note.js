const Note = require("../models/note");
const mongoose = require("mongoose");
const AppError = require("../utils/AppError");

// helper
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// GET ALL (user notes)
exports.getAll = async (userId, searchParams) => {
  const { paginate } = require("../utils/helper");

  return paginate(
    Note,
    searchParams,
    { user: userId },
    "product"
  );
};

// GET ONE
exports.getOne = async (id, userId) => {
  if (!isValidId(id)) {
    throw new AppError(400, "Invalid id");
  }

  const note = await Note.findById(id)
    .populate("user", "name email")
    .lean();

  if (!note) {
    throw new AppError(404, "Note not found");
  }

  if (String(note.user._id) !== String(userId)) {
    throw new AppError(403, "Access denied");
  }

  return note;
};

// CREATE
exports.create = async (userId, data) => {
  return await Note.create({
    ...data,
    user: userId,
  });
};

// UPDATE
exports.update = async (id, userId, data) => {
  if (!isValidId(id)) {
    throw new AppError(400, "Invalid id");
  }

  const note = await Note.findById(id);

  if (!note) {
    throw new AppError(404, "Note not found");
  }

  if (String(note.user) !== String(userId)) {
    throw new AppError(403, "Access denied");
  }

  return await Note.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  );
};

// DELETE
exports.remove = async (id, userId) => {
  if (!isValidId(id)) {
    throw new AppError(400, "Invalid id");
  }

  const note = await Note.findById(id);

  if (!note) {
    throw new AppError(404, "Note not found");
  }

  if (String(note.user) !== String(userId)) {
    throw new AppError(403, "Access denied");
  }

  await Note.findByIdAndDelete(id);

  return true;
};