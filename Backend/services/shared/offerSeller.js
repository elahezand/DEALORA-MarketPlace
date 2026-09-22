const AppError = require("../../utils/AppError");

const OFFER_STATUSES = ["pending", "accepted", "rejected", "all"];

const assertOfferableVariant = (product, variantId) => {
  if (!product || product.status === "deleted") {
    throw new AppError(404, "Product not found");
  }
  if (product.listingType !== "store_product") {
    throw new AppError(400, "Offers can only be created for store products");
  }
  const variant = (product.variants || []).find((v) => String(v._id) === String(variantId));
  if (!variant) {
    throw new AppError(404, "Variant not found on this product");
  }
};

const assertValidStatus = (status) => {
  if (status && !OFFER_STATUSES.includes(status)) {
    throw new AppError(400, "Invalid status parameter");
  }
};

module.exports = {
  assertOfferableVariant,
  assertValidStatus,
};
