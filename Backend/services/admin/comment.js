const Comment = require("../../models/comment");
const mongoose = require("mongoose");
const { paginate } = require("../../utils/helper");
const { buildListQuery, listLimit } = require("../../utils/listQuery");
const AppError = require("../../utils/AppError");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const getAdmin = async (query = {}) => {
  const filters = buildListQuery(query, {
    statuses: ["pending", "approved", "rejected", "spam", "deleted"],
    search: ["body"],
    ids: { listing: "listing", user: "user", store: "store" },
  });

  // type=review → top-level reviews, type=reply → answers to a review
  if (query.type === "review") filters.parentId = null;
  if (query.type === "reply") filters.parentId = { $ne: null };
  // answered=true / false → reviews that do / don't have a reply yet (filtered in the DB,
  // so every page is full). Only meaningful for reviews — ignored for replies.
  if (query.type !== "reply" && (query.answered === "true" || query.answered === "false")) {
    const answeredIds = await Comment.distinct("parentId", { parentId: { $ne: null }, deletedAt: null });
    filters.parentId = null;
    filters._id = query.answered === "true" ? { $in: answeredIds } : { $nin: answeredIds };
  }

  const result = await paginate(Comment, {
    limit: listLimit(query, 15),
    cursor: query.cursor,
    filters,
    populate: [
      { path: "user", select: "_id name username phone" },
      { path: "listing", select: "_id title slug images" },
      { path: "store", select: "_id name slug" },
      { path: "moderation.moderatedBy", select: "_id name username" },
      { path: "parentId", select: "_id body user createdAt", populate: { path: "user", select: "_id name username" } },
    ],
  });

  // tell the admin which reviews were already answered (and let them filter on it)
  const reviewIds = result.data.filter((c) => !c.parentId).map((c) => c._id);
  const replies = reviewIds.length
    ? await Comment.find({ parentId: { $in: reviewIds }, deletedAt: null })
      .select("parentId body status createdAt user")
      .populate("user", "_id name username")
      .sort({ createdAt: 1 })
      .lean()
    : [];

  const repliesByReview = replies.reduce((acc, r) => {
    const key = String(r.parentId);
    (acc[key] ||= []).push(r);
    return acc;
  }, {});

  const data = result.data.map((comment) => ({
    ...comment,
    isReply: !!comment.parentId,
    // the review this answer belongs to, so the admin can read it in the table
    parentComment: comment.parentId || null,
    replies: repliesByReview[String(comment._id)] || [],
    answered: (repliesByReview[String(comment._id)] || []).length > 0,
  }));

  return { data, pagination: result.pagination };
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

  return Comment.findByIdAndUpdate(id, update, { returnDocument: "after" });
};

const adminDelete = async (id) => {
  return Comment.findByIdAndUpdate(
    id,
    {
      status: "deleted",
      deletedAt: new Date(),
      body: "[deleted]",
    },
    { returnDocument: "after" }
  );
};

module.exports = {
  getAdmin,
  replyToComment,
  moderate,
  adminDelete,
};
