const commentService = require("../services/comment");

// GET PRODUCT COMMENTS
exports.getByListing = async (req, res, next) => {
  try {
    const data = await commentService.getByProduct(req.params.listing);
    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
};

// ADMIN - GET ALL
exports.getAdmin = async (req, res, next) => {
  try {
    const data = await commentService.getAdmin(req.query);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

// CREATE COMMENT
exports.create = async (req, res, next) => {
  try {
    const comment = await commentService.create(
      req.user._id,
      req.parsed.data
    );

    res.status(201).json({
      message: "Comment created",
      data: comment,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH COMMENT (USER OWNER)
exports.patch = async (req, res, next) => {
  try {
    const updated = await commentService.updateOwn(
      req.user._id,
      req.params.id,
      req.parsed.data
    );

    res.status(200).json({
      message: "Comment updated",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

// ADMIN MODERATE
exports.moderate = async (req, res, next) => {
  try {
    const updated = await commentService.moderate(
      req.params.id,
      req.user._id,
      req.parsed.data
    );

    res.status(200).json({
      message: "Moderated successfully",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

// ADMIN DELETE
exports.remove = async (req, res, next) => {
  try {
    const deleted = await commentService.adminDelete(
      req.params.id,
      req.user._id
    );

    res.status(200).json({
      message: "Deleted",
      data: deleted,
    });
  } catch (err) {
    next(err);
  }
};

// USER DELETE OWN COMMENT
exports.removeOwn = async (req, res, next) => {
  try {
    const deleted = await commentService.deleteOwn(
      req.user._id,
      req.params.id
    );

    res.status(200).json({
      message: "Deleted",
      data: deleted,
    });
  } catch (err) {
    next(err);
  }
};