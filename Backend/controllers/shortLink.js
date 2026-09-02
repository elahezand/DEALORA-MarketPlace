const Listing = require("../models/listing");

exports.redirectToListing = async (req, res, next) => {
  try {
    const { shortIdentifier } = req.params;

    if (!shortIdentifier) {
      return next({ status: 400, message: "shortIdentifier is required" });
    }
    const Listing = await Listing.findOne({ shortIdentifier }).lean();

    if (!Listing) {
      return next({ status: 404, message: "Listing not found" });
    }

    return res.status(200).json({ data: Listing });
  } catch (err) {
    return next(err);
  }
};