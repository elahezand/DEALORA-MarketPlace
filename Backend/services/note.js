const Note = require("../models/note");
const mongoose = require("mongoose");

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
    throw { status: 400, message: "Invalid id" };
  }

  const note = await Note.findById(id)
    .populate("user", "name email")
    .lean();

  if (!note) {
    throw { status: 404, message: "Note not found" };
  }

  if (String(note.user._id) !== String(userId)) {
    throw { status: 403, message: "Access denied" };
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
    throw { status: 400, message: "Invalid id" };
  }

  const note = await Note.findById(id);

  if (!note) {
    throw { status: 404, message: "Note not found" };
  }

  if (String(note.user) !== String(userId)) {
    throw { status: 403, message: "Access denied" };
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
    throw { status: 400, message: "Invalid id" };
  }

  const note = await Note.findById(id);

  if (!note) {
    throw { status: 404, message: "Note not found" };
  }

  if (String(note.user) !== String(userId)) {
    throw { status: 403, message: "Access denied" };
  }

  await Note.findByIdAndDelete(id);

  return true;
};