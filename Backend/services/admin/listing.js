const mongoose = require("mongoose");
const Listing = require("../../models/listing");
const { paginate, buildListingFilters } = require("../../utils/helper");
const invalidateCache = require("../../utils/cache");
const AppError = require("../../utils/AppError");
const { buildListingDetail, findListingForDetail, PROTECTED_FIELDS } = require("../shared/listing");

const isValidId = mongoose.Types.ObjectId.isValid;

const STATUSES_BY_TYPE = {
  user_ad: ["pending", "accepted", "rejected","deleted"],
  store_product: ["draft", "active", "inactive","deleted"],
};

async function getAllListingsAdmin(query = {}) {
  const filters = await buildListingFilters(query, { isAdmin: true });
  const limit = Math.min(query.limit ? Number(query.limit) : 21, 99);

  return paginate(Listing, {
    limit,
    cursor: query.cursor,
    filters,
    populate: ["categoryPath", "owner"],
  });
}

async function changeStatus(id, status) {
  if (!isValidId(id)) throw new AppError(400, "Invalid listing id");

  const listing = await Listing.findById(id).select("listingType").lean();
  if (!listing) throw new AppError(404, "Listing not found");

  const allowed = STATUSES_BY_TYPE[listing.listingType] || [];
  if (!allowed.includes(status)) {
    throw new AppError(400, `Invalid status for ${listing.listingType}. Allowed: ${allowed.join(", ")}`);
  }

  // findByIdAndUpdate → the model hook notifies the owner (accepted / rejected)
  const updated = await Listing.findByIdAndUpdate(id, { status }, { new: true });

  await invalidateCache("/api/listings*");
  return updated;
}

async function createStoreProduct(data, files = []) {
  const payload = { ...data };
  PROTECTED_FIELDS.forEach((f) => delete payload[f]);

  if (files?.length) {
    payload.images = files.map((f) => `/listings/images/${f.filename}`);
  }

  payload.listingType = "store_product";
  payload.status = "draft";

  const listing = await Listing.create(payload);
  await invalidateCache("/api/listings*");
  return listing;
}

/* === UPDATE ANY LISTING (no re-review for admin edits) === */
async function updateListing(id, data, files = []) {
  if (!isValidId(id)) throw new AppError(400, "Invalid listing id");

  const listing = await Listing.findById(id);
  if (!listing) throw new AppError(404, "Listing not found");

  const updateData = { ...data };
  PROTECTED_FIELDS.forEach((f) => delete updateData[f]);
  if (listing.listingType === "store_product") delete updateData.price;
  else delete updateData.variants;

  if (files?.length) {
    updateData.images = files.map((f) => `/listings/images/${f.filename}`);
  }

  Object.assign(listing, updateData);
  await listing.save(); 

  await invalidateCache("/api/listings*");
  return { listing, needsReview: false };
}

/* === SOFT DELETE ANY LISTING === */
async function deleteListing(id) {
  if (!isValidId(id)) throw new AppError(400, "Invalid listing id");

  const listing = await Listing.findById(id);
  if (!listing) throw new AppError(404, "Listing not found");

  listing.status = "deleted";
  await listing.save();

  await invalidateCache("/api/listings*");
  return true;
}

/* === PREVIEW ANY LISTING (any status) === */
async function getListingPreview(id) {
  if (!isValidId(id)) throw new AppError(400, "Invalid listing id");

  const listingData = await findListingForDetail(id);
  if (!listingData) throw new AppError(404, "Listing not found");

  const result = await buildListingDetail(listingData);
  return { ...result, preview: true };
}

module.exports = {
  createStoreProduct,
  updateListing,
  deleteListing,
  getListingPreview,
  getAllListingsAdmin,
  changeStatus,
};
