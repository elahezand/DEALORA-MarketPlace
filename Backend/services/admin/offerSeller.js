const mongoose = require("mongoose");
const OfferSeller = require("../../models/offerSeller");
const Listing = require("../../models/listing");
const { paginate } = require("../../utils/helper");
const { buildDateFilter, getAdminSort } = require("../../utils/adminQuery");
const AppError = require("../../utils/AppError");
const { assertOfferableVariant, assertValidStatus } = require("../shared/offerSeller");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const PRODUCT_FIELDS = "_id title slug images variants listingType status";

const getAll = async (query = {}) => {
  if (Number(query.limit) > 100) throw new AppError(400, "Limit must be <= 100");
  assertValidStatus(query.status);

  const filters = {};
  Object.assign(filters, buildDateFilter(query, "createdAt"));
  if (query.status) filters.status = query.status;
  if (!query.status || query.status === "all") {
    filters.status = { $ne: "deleted" };
  }


  return paginate(OfferSeller, {
    limit: query.limit,
    cursor: query.cursor,
    filters,
    populate: [
      { path: "productId", select: PRODUCT_FIELDS },
      { path: "store", select: "name slug owner", populate: { path: "owner", select: "name username phone" } },
    ],
    sort: getAdminSort(query, ["createdAt", "updatedAt"])
  });
};

// === APPROVE / REJECT (ADMIN) ===
const approve = async (offerId, adminId, data) => {
  if (!isValidId(offerId)) throw new AppError(400, "Invalid offerId");
  if (!["accepted", "rejected"].includes(data.status)) {
    throw new AppError(400, "Invalid action status. Must be accepted or rejected");
  }

  const offer = await OfferSeller.findById(offerId);
  if (!offer) throw new AppError(404, "Offer not found");
  if (offer.status !== "pending") throw new AppError(409, "Offer has already been processed");

  if (data.status === "accepted") {
    const product = await Listing.findById(offer.productId).select("listingType status variants").lean();
    assertOfferableVariant(product, offer.variantId);
  }

  const updated = await OfferSeller.findOneAndUpdate(
    { _id: offerId, status: "pending" },
    {
      $set: {
        status: data.status,
        adminComment:
          data.adminComment ||
          (data.status === "accepted" ? "Approved by administration" : "Rejected by administration"),
      },
    },
    { returnDocument: "after" }
  );
  if (!updated) throw new AppError(409, "Offer has already been processed");

  return updated;
};

// === DELETE ANY OFFER (any status) ===
const remove = async (offerId) => {
  if (!isValidId(offerId)) throw new AppError(400, "Invalid offerId");

  const offer = await OfferSeller.findByIdAndDelete(offerId); 
  if (!offer) throw new AppError(404, "Offer not found");
  return true;
};

module.exports = {
  remove,
  getAll,
  approve,
};
