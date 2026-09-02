const Listing = require("../models/listing");
const AppError = require("../utils/AppError");

exports.redirectToListing = async (req, res, next) => {
  try {
    const { shortIdentifier } = req.params;

    if (!shortIdentifier) {
      return next(new AppError(400, "shortIdentifier is required"));
    }
    const Listing = await Listing.findOne({ shortIdentifier }).lean();

    if (!Listing) {
      return next(new AppError(404, "Listing not found"));
    }

    return res.status(200).json({ data: Listing });
  } catch (err) {
    return next(err);
  }
};