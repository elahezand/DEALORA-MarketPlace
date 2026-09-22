const Listing = require("../../models/listing");
const OfferSeller = require("../../models/offerSeller");

const PUBLIC_OWNER_FIELDS = "_id name username";

async function buildListingDetail(listingData) {
  if (listingData.listingType !== "store_product") {
    return { data: listingData };
  }

  listingData.offers = await OfferSeller.find({
    productId: listingData._id,
    status: "accepted",
    stock: { $gt: 0 },
  })
    .select("variantId price discount finalPrice stock shipsWithinDays description store")
    .populate("store", "_id name slug meta.ratings meta.reviewsCount")
    .sort({ finalPrice: 1 })
    .lean();

  return { data: listingData };
}

const findListingForDetail = (id) =>
  Listing.findById(id)
    .populate("categoryPath", "_id title slug")
    .populate("owner", PUBLIC_OWNER_FIELDS)
    .lean();

const PROTECTED_FIELDS = ["status", "owner", "minPrice", "metrics", "slug", "shortIdentifier", "listingType"];

module.exports = {
  PROTECTED_FIELDS,
  buildListingDetail,
  findListingForDetail,
};

