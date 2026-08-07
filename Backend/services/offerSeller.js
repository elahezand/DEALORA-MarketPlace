const mongoose = require("mongoose");
const OfferSeller = require("../models/offerSeller");
const Store = require("../models/store");
const Listing = require("../models/listing"); // Sync ba model-e yekparche va daqiqi ke dari
const paginate = require("../utils/helper");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// === CREATE OFFER ===
exports.createOffer = async (userId, data) => {
  const { productId, price, stock, description } = data; // Strict destructuring baraye jolo-giri az Mass Assignment

  if (!isValidId(productId)) {
    throw { status: 400, message: "Invalid productId" };
  }

  const store = await Store.findOne({ owner: userId }).lean();
  if (!store) {
    throw { status: 404, message: "Store not found" };
  }

  // Peida kardan va check kardan-e type mahsul az model-e Listing
  const listing = await Listing.findById(productId).lean();
  if (!listing) {
    throw { status: 404, message: "Product/Listing not found" };
  }
  
  if (listing.listingType !== "store_product") {
    throw { status: 400, message: "Offers can only be created for store products" };
  }

  // Jolo-giri az Concurrent Request Bugs (Race Condition)
  const existingOffer = await OfferSeller.findOne({
    product: productId,
    seller: userId,
    status: { $in: ["pending", "accepted"] },
  }).lean();

  if (existingOffer) {
    throw {
      status: 409,
      message: "You already have an active or pending offer for this product",
    };
  }

  return await OfferSeller.create({
    product: productId,
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
  const { productId, price, stock, description } = data;

  if (!isValidId(productId)) throw { status: 400, message: "Invalid productId" };

  const offer = await OfferSeller.findOne({
    product: productId,
    seller: userId,
    status: { $in: ["pending", "accepted"] },
  });

  if (!offer) {
    throw { status: 404, message: "Active offer not found" };
  }

  // Faqat field-haye mojaz updatable hastand ta data leakage rukh nade
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
    throw { status: 400, message: "Limit must be <= 100" };
  }

  const filters = {};
  if (query.status) {
    const allowed = ["pending", "accepted", "rejected"];
    if (!allowed.includes(query.status)) {
      throw { status: 400, message: "Invalid status parameter" };
    }
    filters.status = query.status;
  }

  return paginate(OfferSeller, {
    limit: query.limit,
    cursor: query.cursor,
    filters,
    populate: [
      { path: "seller", select: "-password" },
      { path: "product" },
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
      throw { status: 400, message: "Invalid status parameter" };
    }
    filters.status = query.status;
  }

  return paginate(OfferSeller, {
    limit: query.limit,
    cursor: query.cursor,
    filters,
    populate: ["product", "store"],
  });
};

// === DELETE OFFER ===
exports.remove = async (offerId, user) => {
  if (!isValidId(offerId)) throw { status: 400, message: "Invalid offerId" };

  const offer = await OfferSeller.findById(offerId);
  if (!offer) throw { status: 404, message: "Offer not found" };

  const isOwner = offer.seller.toString() === user._id.toString();
  const isAdmin = user.role === "ADMIN";

  if (!isOwner && !isAdmin) throw { status: 403, message: "Forbidden" };

  // Sellers faqat pishnahad-haye pending ro mitonand pak konand
  if (!isAdmin && offer.status !== "pending") {
    throw { status: 409, message: "Only pending offers can be deleted by the seller" };
  }

  await OfferSeller.findByIdAndDelete(offerId);
  return true;
};

// === APPROVE / REJECT OFFER (ADMIN) ===
exports.approve = async (offerId, adminId, data) => {
  if (!["accepted", "rejected"].includes(data.status)) {
    throw { status: 400, message: "Invalid action status. Must be accepted or rejected" };
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const offer = await OfferSeller.findById(offerId).session(session);
    if (!offer) throw { status: 404, message: "Offer not found" };

    if (offer.status !== "pending") {
      throw { status: 409, message: "Offer has already been processed" };
    }

    // 1. REJECT LOGIC
    if (data.status === "rejected") {
      offer.status = "rejected";
      offer.adminComment = data.adminComment || "Rejected by administration";
      
      await offer.save({ session });
      await session.commitTransaction();
      return offer;
    }

    // 2. ACCEPT LOGIC (Kamelan ba model-e Virtual relation-e to match shod)
    const listing = await Listing.findById(offer.product).session(session);
    if (!listing) throw { status: 404, message: "Target listing product not found" };

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