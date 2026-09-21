const userCommentService = require("../../services/user/comment");
const invalidateCache = require("../../utils/cache");

const create = async (req, res, next) => {
  try {
    const comment = await userCommentService.create(
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

const patch = async (req, res, next) => {
  try {
    const updated = await userCommentService.updateOwn(
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

const removeOwn = async (req, res, next) => {
  try {
    const deleted = await userCommentService.deleteOwn(
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

module.exports = {
  create,
  patch,
  removeOwn,
};
