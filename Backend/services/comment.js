const Comment = require("../models/comment");
const mongoose = require("mongoose");
const {paginate} = require("../utils/helper");
const AppError = require("../utils/AppError");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/*  GET BY PRODUCT  */

exports.getByProduct = async (listing, query = {}) => {
  if (!isValidId(listing)) {
    throw new AppError(400, "Invalid listing");
  }

  const filters = {
    listing,
    parentId: null,
    status: "approved",
    deletedAt: null,
  };

const parents = await paginate(Comment, {
  limit: query.limit,
  cursor: query.cursor,
  filters: filters,
  populate: "user", 
});
  const parentIds = parents.data.map((p) => p._id);

  const replies = parentIds.length
    ? await Comment.find({
        listing,
        parentId: { $in: parentIds },
        status: "approved",
        deletedAt: null,
      }).populate("user")
    : [];

  const map = new Map();

  parents.data.forEach((p) => {
    const obj = typeof p.toObject === "function" ? p.toObject() : { ...p };
    obj.replies = [];
    map.set(String(obj._id), obj);
  });

  replies.forEach((r) => {
    const replyObj = typeof r.toObject === "function" ? r.toObject() : r;
    const parent = map.get(String(replyObj.parentId));
    if (parent) parent.replies.push(replyObj);
  });

  return {
    data: Array.from(map.values()),
    pagination: parents.pagination,
  };
};
/*  ADMIN - GET ALL (moderation queue)  */

exports.getAdmin = async (query = {}) => {
  const filters = {};
  if (query.status) filters.status = query.status;
  if (query.productId && isValidId(query.listing)) filters.listing = query.listing;

  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);

  return paginate(Comment, {
    limit,
    cursor: query.cursor,
    filters,
    populate: [
      { path: "user", select: "username phone" },
      { path: "listing", select: "title" },
    ],
  });
};

/*  CREATE  */

exports.create = async (userId, data) => {
  let { parentId, ...rest } = data;

  let listing = rest.listing;

  if (parentId) {
    if (!isValidId(parentId)) {
      throw new AppError(400, "Invalid parentId");
    }

    const parent = await Comment.findById(parentId);

    if (!parent) {
      throw new AppError(404, "Parent not found");
    }

    if (parent.parentId) {
      throw new AppError(409, "Only 1 level reply allowed");
    }

    listing = parent.listing;
  }

  return Comment.create({
    user: userId,
    listing,
    parentId: parentId || null,
    ...rest,
  });
};

/*  UPDATE OWN  */

exports.updateOwn = async (userId, id, data) => {
  const comment = await Comment.findOne({
    _id: id,
    user: userId,
    deletedAt: null,
  });

  if (!comment) {
    throw new AppError(404, "Comment not found");
  }

  if (comment.status !== "pending") {
    throw new AppError(409, "Only pending comments can be edited");
  }

  Object.assign(comment, data, {
    editedAt: new Date(),
  });

  return comment.save();
};

/*  MODERATION   */

exports.moderate = async (id, adminId, data) => {
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

/*  ADMIN DELETE   */

exports.adminDelete = async (id) => {
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

/*  USER DELETE  */

exports.deleteOwn = async (userId, id) => {
  return Comment.findOneAndUpdate(
    { _id: id, user: userId, deletedAt: null },
    {
      status: "deleted",
      deletedAt: new Date(),
      body: "[deleted]",
    },
    { new: true }
  );
};