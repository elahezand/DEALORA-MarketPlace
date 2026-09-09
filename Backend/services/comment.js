const Comment = require("../models/comment");
const Listing = require("../models/listing");
const Order = require("../models/order");
const mongoose = require("mongoose");
const { paginate } = require("../utils/helper");
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
  if (query.listing && isValidId(query.listing)) filters.listing = query.listing;

  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);

  return paginate(Comment, {
    limit,
    cursor: query.cursor,
    filters,
    populate: [
      { path: "user", select: "username phone" },
      { path: "listing", select: "title" },
      { path: "parentId", select: "body" },
    ],
  });
};

exports.replyToComment = async (adminId, parentId, body) => {
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
/*  CREATE  */
exports.create = async (userId, data) => {
  const { listing, ...rest } = data;

  if (!isValidId(listing)) {
    throw new AppError(400, "Invalid listing");
  }

  const targetListing = await Listing.findById(listing).select("listingType").lean();
  if (!targetListing) {
    throw new AppError(404, "Listing not found");
  }
  if (targetListing.listingType !== "store_product") {
    throw new AppError(400, "Reviews can only be left on store products");
  }

  const existingReview = await Comment.findOne({
    user: userId,
    listing,
    parentId: null,
    deletedAt: null,
  }).lean();
  if (existingReview) {
    throw new AppError(409, "You have already reviewed this product");
  }

  const order = await Order.findOne({
    user: userId,
    "items.product": listing,
    paymentStatus: "paid",
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!order) {
    throw new AppError(403, "You can only review products you have purchased and paid for");
  }

  let store = null;
  let verifiedPurchase = false;
  const matchingItem = order.items.find((it) => String(it.product) === String(listing));
  if (matchingItem?.seller) {
    store = matchingItem.seller;
    verifiedPurchase = true;
  }

  try {
    return await Comment.create({
      user: userId,
      listing,
      store,
      verifiedPurchase,
      parentId: null,
      ...rest,
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError(409, "You have already reviewed this product");
    }
    throw err;
  }
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