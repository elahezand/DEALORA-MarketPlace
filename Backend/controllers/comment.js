const commentService = require("../services/comment");
const invalidateCache = require("../utils/cache");

// GET PRODUCT COMMENTS
exports.getByListing = async (req, res, next) => {
  try {
    const result = await commentService.getByProduct(req.params.listing, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ADMIN - GET ALL AND ANSWER
exports.getAdmin = async (req, res, next) => {
  try {
    const result = await commentService.getAdmin(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};
exports.reply = async (req, res, next) => {
  try {
    const reply = await commentService.replyToComment(
      req.user._id,
      req.params.id,
      req.parsed.data.body
    );

    await invalidateCache(`/api/comments/listing/${reply.listing}*`);

    res.status(201).json({
      success: true,
      message: "Reply posted",
      data: reply,
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

    if (updated) {
      await invalidateCache(`/api/comments/listing/${updated.listing}*`);
    }

    res.status(200).json({
      success: true,
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

    if (deleted) {
      await invalidateCache(`/api/comments/listing/${deleted.listing}*`);
    }

    res.status(200).json({
      success: true,
      message: "Deleted",
      data: deleted,
    });
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

    await invalidateCache(`/api/comments/listing/${comment.listing}*`);

    res.status(201).json({
      success: true,
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

    await invalidateCache(`/api/comments/listing/${updated.listing}*`);

    res.status(200).json({
      success: true,
      message: "Comment updated",
      data: updated,
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

    if (deleted) {
      await invalidateCache(`/api/comments/listing/${deleted.listing}*`);
    }

    res.status(200).json({
      success: true,
      message: "Deleted",
      data: deleted,
    });
  } catch (err) {
    next(err);
  }
};
