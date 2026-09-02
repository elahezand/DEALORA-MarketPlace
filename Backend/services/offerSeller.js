const mongoose = require("mongoose");
const OfferSeller = require("../models/offerSeller");
const Store = require("../models/store");
const Listing = require("../models/listing");
const {paginate} = require("../utils/helper");
const AppError = require("../utils/AppError");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// === CREATE OFFER ===
exports.createOffer = async (userId, data) => {
  const {listingId, price, stock, description } = data;
  if (!isValidId(listingId)) {
    throw new AppError(400, "Invalid listingId");
  }

  const store = await Store.findOne({ owner: userId }).lean();
  if (!store) {
    throw new AppError(404, "Store not found");
  }

  const listing = await Listing.findById(listingId).lean();
  if (!listing) {
    throw new AppError(404, "Listing not found");
  }

  if (listing.listingType !== "store_product") {
    throw new AppError(400, "Offers can only be created for store listings");
  }

  const existingOffer = await OfferSeller.findOne({
    listing: listingId,
    seller: userId,
    status: { $in: ["pending", "accepted"] },
  }).lean();

  if (existingOffer) {
    throw new AppError(409, "You already have an active or pending offer for this Listing");
  }

  return await OfferSeller.create({
    listing: listingId,
    seller: userId,
    store: store._id,
    price,
    stock,
    description,
    status: "pending",
  });
};

// === UPDATE OFFER ===
exports.updateOffer = async (userId, data) => {
  const { listingId, price, stock, description } = data;

  if (!isValidId(listingId)) throw new AppError(400, "Invalid listingId");

  const offer = await OfferSeller.findOne({
    listing: listingId,
    seller: userId,
    status: { $in: ["pending", "accepted"] },
  });

  if (!offer) {
    throw new AppError(404, "Active offer not found");
  }

  if (price !== undefined) offer.price = price;
  if (stock !== undefined) offer.stock = stock;
  if (description !== undefined) offer.description = description;

  await offer.save();
  return offer;
};

// === GET ALL (ADMIN) ===
exports.getAll = async (query = {}) => {
  const limit = Number(query.limit);
  if (limit && limit > 100) {
    throw new AppError(400, "Limit must be <= 100");
  }

  const filters = {};
  if (query.status) {
    const allowed = ["pending", "accepted", "rejected"];
    if (!allowed.includes(query.status)) {
      throw new AppError(400, "Invalid status parameter");
    }
    filters.status = query.status;
  }

  return paginate(OfferSeller, {
    limit: query.limit,
    cursor: query.cursor,
    filters,
    populate: [
      { path: "seller", select: "-password" },
      { path: "listing" },
      { path: "store" },
    ],
  });
};

// === GET MY OFFERS ===
exports.getMine = async (userId, query = {}) => {
  const filters = { seller: userId };

  if (query.status) {
    const allowed = ["pending", "accepted", "rejected"];
    if (!allowed.includes(query.status)) {
      throw new AppError(400, "Invalid status parameter");
    }
    filters.status = query.status;
  }

  return paginate(OfferSeller, {
    limit: query.limit,
    cursor: query.cursor,
    filters,
    populate: ["listing", "store"],
  });
};

// === DELETE OFFER ===
exports.remove = async (offerId, user) => {
  if (!isValidId(offerId)) throw new AppError(400, "Invalid offerId");

  const offer = await OfferSeller.findById(offerId);
  if (!offer) throw new AppError(404, "Offer not found");

  const isOwner = offer.seller.toString() === user._id.toString();
  const isAdmin = user.role === "ADMIN";

  if (!isOwner && !isAdmin) throw new AppError(403, "Forbidden");

  if (!isAdmin && offer.status !== "pending") {
    throw new AppError(409, "Only pending offers can be deleted by the seller");
  }

  await OfferSeller.findByIdAndDelete(offerId);
  return true;
};

// === APPROVE / REJECT OFFER (ADMIN) ===
exports.approve = async (offerId, adminId, data) => {
  if (!["accepted", "rejected"].includes(data.status)) {
    throw new AppError(400, "Invalid action status. Must be accepted or rejected");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const offer = await OfferSeller.findById(offerId).session(session);
    if (!offer) throw new AppError(404, "Offer not found");

    if (offer.status !== "pending") {
      throw new AppError(409, "Offer has already been processed");
    }

    // 1. REJECT LOGIC
    if (data.status === "rejected") {
      offer.status = "rejected";
      offer.adminComment = data.adminComment || "Rejected by administration";

      await offer.save({ session });
      await session.commitTransaction();
      return offer;
    }

    // 2. ACCEPT LOGIC 
    const listing = await Listing.findById(offer.listing).session(session);
    if (!listing) throw new AppError(404, "Target listing not found");

    offer.status = "accepted";
    offer.adminComment = data.adminComment || "Approved by administration";

    await offer.save({ session });

    await session.commitTransaction();
    return offer;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};