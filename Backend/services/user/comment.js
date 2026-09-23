const Comment = require("../../models/comment");
const Listing = require("../../models/listing");
const Order = require("../../models/order");
const mongoose = require("mongoose");
const AppError = require("../../utils/AppError");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const create = async (userId, data) => {
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
    "items.productId": listing,
    $or: [{ paymentStatus: "paid" }, { status: "completed" }],
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!order) {
    throw new AppError(403, "You can only review products you have purchased and paid for");
  }

  const matchingItem = order.items.find((it) => String(it.productId) === String(listing));
  const store = matchingItem?.store || null;

  try {
    return await Comment.create({
      ...rest,
      user: userId,
      listing,
      store,
      verifiedPurchase: true,
      parentId: null,
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError(409, "You have already reviewed this product");
    }
    throw err;
  }
};

const updateOwn = async (userId, id, data) => {
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


const deleteOwn = async (userId, id) => {
  return Comment.findOneAndUpdate(
    { _id: id, user: userId, deletedAt: null },
    {
      status: "deleted",
      deletedAt: new Date(),
      body: "[deleted]",
    },
    { returnDocument: "after" }
  );
};

module.exports = {
  create,
  updateOwn,
  deleteOwn,
};
