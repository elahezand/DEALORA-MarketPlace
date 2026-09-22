const mongoose = require("mongoose");
const Listing = require("../../models/listing");
const OfferSeller = require("../../models/offerSeller");
const { paginate, buildListingFilters } = require("../../utils/helper");
const invalidateCache = require("../../utils/cache");
const AppError = require("../../utils/AppError");
const { buildListingDetail, PROTECTED_FIELDS } = require("../shared/listing");

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
    sort: { _id: -1 } 
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
  const updated = await Listing.findByIdAndUpdate(id, { status }, { new: true });

  await invalidateCache("/api/listings*");
  return updated;
}

const EDITABLE_PRODUCT_STATUSES = ["draft", "active", "inactive"];

const uploadedPaths = (files = []) => files.map((f) => `/listings/images/${f.filename}`);

const pickProductStatus = (status) =>
  EDITABLE_PRODUCT_STATUSES.includes(status) ? status : undefined;

// a variant that sellers still offer on can't be removed (their offers point to its id)
async function assertRemovedVariantsHaveNoOffers(listing, nextVariants) {
  const keptIds = new Set(nextVariants.filter((v) => v._id).map((v) => String(v._id)));
  const removedIds = listing.variants.map((v) => String(v._id)).filter((id) => !keptIds.has(id));
  if (!removedIds.length) return;

  const hasOffers = await OfferSeller.exists({
    product: listing._id,
    variantId: { $in: removedIds },
    status: { $in: ["pending", "accepted"] },
  });
  if (hasOffers) {
    throw new AppError(409, "A removed variant still has seller offers. Reject or delete those offers first.");
  }
}

async function createStoreProduct(data, files = []) {
  const payload = { ...data };
  PROTECTED_FIELDS.forEach((f) => delete payload[f]);

  payload.images = [...(data.images || []), ...uploadedPaths(files)];
  payload.listingType = "store_product";
  payload.status = pickProductStatus(data.status) || "draft";

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

  if (listing.listingType === "store_product") {
    delete updateData.price;
    const status = pickProductStatus(data.status);
    if (status) updateData.status = status;
    if (updateData.variants) await assertRemovedVariantsHaveNoOffers(listing, updateData.variants);
  } else {
    delete updateData.variants;
  }

  // images = the ones the admin kept + the new uploads
  if (data.images || files?.length) {
    updateData.images = [...(data.images ?? listing.images), ...uploadedPaths(files)];
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

  const listingData = await Listing.findById(id)
    .populate("categoryPath", "_id title slug")
    .populate("owner", "_id name username phone")
    .lean();
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
