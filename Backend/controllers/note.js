const service = require("../services/note");

// GET ALL
exports.getAll = async (req, res, next) => {
  try {
    const result = await service.getAll(
      req.user._id,
      new URLSearchParams(req.query || {})
    );

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

// GET ONE
exports.getOne = async (req, res, next) => {
  try {
    const note = await service.getOne(req.params.id, req.user._id);
    res.status(200).json(note);
  } catch (err) {
    next(err);
  }
};

// CREATE
exports.postNote = async (req, res, next) => {
  try {
    const note = await service.create(req.user._id, req.parsed.data);
    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
};

// UPDATE
exports.updateNote = async (req, res, next) => {
  try {
    const note = await service.update(
      req.params.id,
      req.user._id,
      req.parsed.data
    );

    res.status(200).json(note);
  } catch (err) {
    next(err);
  }
};

// DELETE
exports.removeNote = async (req, res, next) => {
  try {
    await service.remove(req.params.id, req.user._id);
    res.status(200).json({ message: "Note deleted successfully" });
  } catch (err) {
    next(err);
  }
};