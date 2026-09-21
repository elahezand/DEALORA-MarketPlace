const adminCommentService = require("../../services/admin/comment");
const invalidateCache = require("../../utils/cache");

const getAdmin = async (req, res, next) => {
  try {
    const result = await adminCommentService.getAdmin(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const reply = async (req, res, next) => {
  try {
    const reply = await adminCommentService.replyToComment(
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
const moderate = async (req, res, next) => {
  try {
    const updated = await adminCommentService.moderate(
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
const remove = async (req, res, next) => {
  try {
    const deleted = await adminCommentService.adminDelete(
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

module.exports = {
  getAdmin,
  moderate,
  remove,
  reply,
};
