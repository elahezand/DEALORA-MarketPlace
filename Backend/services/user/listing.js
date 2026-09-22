const mongoose = require("mongoose");
const Listing = require("../../models/listing");
const { paginate } = require("../../utils/helper");
const invalidateCache = require("../../utils/cache");
const AppError = require("../../utils/AppError");
const { buildListingDetail, findListingForDetail, PROTECTED_FIELDS } = require("../shared/listing");

const isValidId = mongoose.Types.ObjectId.isValid;

async function findOwnAd(id, userId) {
  if (!isValidId(id)) throw new AppError(400, "Invalid listing id");

  const listing = await Listing.findById(id);
  if (!listing) throw new AppError(404, "Listing not found");

  if (listing.listingType !== "user_ad") {
    throw new AppError(403, "Only an admin can change a store product listing");
  }
  if (String(listing.owner) !== String(userId)) {
    throw new AppError(403, "Unauthorized action");
  }
  return listing;
}

async function createListing(user, data, files = []) {
  if (data.listingType === "store_product") {
    throw new AppError(403, "Only an admin can create a store product");
  }

  const payload = { ...data };
  PROTECTED_FIELDS.forEach((f) => delete payload[f]);

  if (files?.length) {
    payload.images = files.map((f) => `/listings/images/${f.filename}`);
  }

  payload.listingType = "user_ad";
  payload.owner = user._id;
  payload.status = "pending";

  const listing = await Listing.create(payload);
  await invalidateCache("/api/listings*");
  return listing;
}

async function updateListing(id, user, data, files = []) {
  const listing = await findOwnAd(id, user._id);

  const updateData = { ...data };

  if (files?.length) {
    updateData.images = files.map((f) => `/listings/images/${f.filename}`);
  }
  const hasChanges = Object.keys(updateData).length > 0;
  let needsReview = false;
  if (hasChanges && ["accepted", "rejected"].includes(listing.status)) {
    listing.status = "pending";
    needsReview = true;
  }

  Object.assign(listing, updateData);
  await listing.save();

  await invalidateCache("/api/listings*");
  return { listing, needsReview };
}

async function deleteListing(id, user) {
  const listing = await findOwnAd(id, user._id);

  listing.status = "deleted";
  await listing.save();

  await invalidateCache("/api/listings*");
  return true;
}
async function getMyListings(userId, query = {}) {
  const limit = Math.min(query.limit ? Number(query.limit) : 21, 48);

  const filters = { owner: userId, status: { $ne: "deleted" } };
  if (query.status && query.status !== "all" && query.status !== "deleted") {
    filters.status = query.status;
  }

  return paginate(Listing, {
    limit,
    cursor: query.cursor,
    filters,
    populate: [{ path: "categoryPath", select: "_id title slug" }],
    sort: { _id: -1 }
  });
}

async function getListingPreview(id, user) {
  if (!isValidId(id)) throw new AppError(400, "Invalid listing id");

  const listingData = await findListingForDetail(id);
  const ownerId = listingData?.owner?._id || listingData?.owner;

  if (!listingData || !ownerId || String(ownerId) !== String(user._id) || listingData.status === "deleted") {
    throw new AppError(404, "Listing not found");
  }

  const result = await buildListingDetail(listingData);
  return { ...result, preview: true };
}

module.exports = {
  createListing,
  updateListing,
  deleteListing,
  getMyListings,
  getListingPreview,
};
