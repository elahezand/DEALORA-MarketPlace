const Listing = require("../../models/listing");
const AppError = require("../../utils/AppError");

// what a stranger may see — no owner contact info, no metrics internals
const PUBLIC_FIELDS = "_id title slug images price minPrice listingType condition location createdAt";
const PUBLIC_STATUS = [
  { listingType: "user_ad", status: "accepted" },
  { listingType: "store_product", status: "active" },
];

const redirectToListing = async (req, res, next) => {
  try {
    const { shortIdentifier } = req.params;

    if (!shortIdentifier || !/^[\w-]{1,64}$/.test(shortIdentifier)) {
      return next(new AppError(400, "shortIdentifier is invalid"));
    }

    // pending / rejected / deleted listings used to leak through this link
    const listing = await Listing.findOne({ shortIdentifier: String(shortIdentifier), $or: PUBLIC_STATUS })
      .select(PUBLIC_FIELDS)
      .lean();

    if (!listing) {
      return next(new AppError(404, "Listing not found"));
    }

    return res.status(200).json({ success: true, data: listing });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  redirectToListing,
};
