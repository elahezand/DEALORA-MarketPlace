const round2 = (n) => Math.round(Number(n) * 100) / 100;

function calcFinalPrice(price, discount = 0) {
  const p = Number(price) || 0;
  const d = Math.min(Math.max(Number(discount) || 0, 0), 100);
  return round2(p - (p * d) / 100);
}

function variantFinalPrice(variant) {
  return variant ? variant.finalPrice : null;
}

/** Lowest number in the list, or null when the list is empty. */
function minOf(values) {
  const nums = values.filter((v) => typeof v === "number" && !Number.isNaN(v));
  return nums.length ? Math.min(...nums) : null;
}

/**
 * Pure calculation of a listing's minPrice.
 * @param {object} listing   plain object or mongoose doc
 * @param {number[]} offerFinalPrices  finalPrice of accepted, in-stock offers
 */
function computeMinPrice(listing, offerFinalPrices = []) {
  if (!listing) return null;
  if (listing.listingType === "user_ad") {
    return typeof listing.price === "number" ? listing.price : null;
  }
  const variantPrices = (listing.variants || []).map(variantFinalPrice);
  return minOf([...variantPrices, ...offerFinalPrices]);
}

/** Loads the accepted, in-stock offers of a listing and returns their final prices. */
async function getOfferFinalPrices(listingId) {
  const mongoose = require("mongoose");
  const OfferSeller = mongoose.models.OfferSeller;
  if (!OfferSeller || !listingId) return [];
  const offers = await OfferSeller.find({
    listing: listingId,
    status: "accepted",
    stock: { $gt: 0 },
  }).select("price discount").lean();
  return offers.map((o) => calcFinalPrice(o.price, o.discount));
}

/** Recomputes and stores Listing.minPrice (used after an offer changes). */
async function syncListingMinPrice(listingId) {
  const mongoose = require("mongoose");
  const Listing = mongoose.models.Listing;
  if (!Listing || !listingId) return;

  const listing = await Listing.findById(listingId)
    .select("listingType price variants")
    .lean();
  if (!listing) return;

  const offerPrices =
    listing.listingType === "store_product" ? await getOfferFinalPrices(listingId) : [];
  const minPrice = computeMinPrice(listing, offerPrices);

  // updateOne (not save) → does not trigger listing hooks / notifications.
  await Listing.updateOne({ _id: listingId }, { $set: { minPrice } });
}

module.exports = {
  round2,
  calcFinalPrice,
  variantFinalPrice,
  computeMinPrice,
  getOfferFinalPrices,
  syncListingMinPrice,
};