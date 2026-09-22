const Comment = require("../../models/comment");
const mongoose = require("mongoose");
const { paginate } = require("../../utils/helper");
const AppError = require("../../utils/AppError");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const getAdmin = async (query = {}) => {
  const filters = {};
  if (query.status) filters.status = query.status;
  if (query.listing && isValidId(query.listing)) filters.listing = query.listing;

  const limit = Math.min(Number(query.limit) || 15, 100);

  return paginate(Comment, {
    limit,
    cursor: query.cursor,
    filters,
    populate: [
      { path: "user", select: "username phone" },
      { path: "listing", select: "title" },
      { path: "parentId", select: "body" },
    ],
    sort: { _id: -1 }
  });
};

const replyToComment = async (adminId, parentId, body) => {
  if (!isValidId(parentId)) {
    throw new AppError(400, "Invalid comment id");
  }

  const parent = await Comment.findById(parentId);
  if (!parent || parent.deletedAt) {
    throw new AppError(404, "Comment not found");
  }

  if (parent.parentId) {
    throw new AppError(409, "Only 1 level reply allowed");
  }

  if (parent.status !== "approved") {
    parent.status = "approved";
    await parent.save();
  }
  return Comment.create({
    user: adminId,
    listing: parent.listing,
    parentId: parent._id,
    body,
    status: "approved",
    recommendation: "no_idea",
  });
};

const moderate = async (id, adminId, data) => {
  const update = {
    status: data.status,
    "moderation.moderatedBy": adminId,
    "moderation.moderatedAt": new Date(),
  };

  if (data.status === "rejected" || data.status === "spam") {
    update["moderation.rejectReason"] = data.rejectReason || null;
  }

  if (data.status === "deleted") {
    update.deletedAt = new Date();
    update.body = "[deleted]";
    update.status = "deleted";
  }

  return Comment.findByIdAndUpdate(id, update, { new: true });
};

const adminDelete = async (id) => {
  return Comment.findByIdAndUpdate(
    id,
    {
      status: "deleted",
      deletedAt: new Date(),
      body: "[deleted]",
    },
    { new: true }
  );
};

module.exports = {
  getAdmin,
  replyToComment,
  moderate,
  adminDelete,
};
