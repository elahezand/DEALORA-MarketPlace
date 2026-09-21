const Comment = require("../../models/comment");
const mongoose = require("mongoose");
const { paginate } = require("../../utils/helper");
const AppError = require("../../utils/AppError");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const PUBLIC_USER_FIELDS = "_id name username profilePicture";

const getByProduct = async (listing, query = {}) => {
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
    populate: { path: "user", select: PUBLIC_USER_FIELDS },
  });

  const parentIds = parents.data.map((p) => p._id);

  const replies = parentIds.length
    ? await Comment.find({
      listing,
      parentId: { $in: parentIds },
      status: "approved",
      deletedAt: null,
    }).populate("user", PUBLIC_USER_FIELDS)
    : [];

  const byParent = new Map();
  for (const reply of replies) {
    const parentId = String(reply.parentId);
    if (!byParent.has(parentId)) {
      byParent.set(parentId, []);
    }
    byParent.get(parentId).push(reply);
  }

  const data = parents.data.map((parent) => {
    const plain = typeof parent.toObject === "function"
      ? parent.toObject()
      : parent;
    return {
      ...plain,
      replies: byParent.get(String(parent._id)) || [],
    };
  });

  return {
    data,
    pagination: parents.pagination,
  };
};

module.exports = {
  getByProduct,
};
