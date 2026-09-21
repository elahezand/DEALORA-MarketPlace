const userListingService = require("../../services/user/listing");

const getPreview = async (req, res, next) => {
  try {
    const result = await userListingService.getListingPreview(req.params.id, req.user);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getMyListings = async (req, res, next) => {
  try {
    const result = await userListingService.getMyListings(req.user._id, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const createListing = async (req, res, next) => {
  try {
    const listing = await userListingService.createListing(req.user, req.parsed.data, req.files);
    res.status(201).json({
      success: true,
      message: "Listing created successfully",
      data: listing,
    });
  } catch (err) {
    next(err);
  }
};

const updateListing = async (req, res, next) => {
  try {
    console.log(req.files);
    
    const { listing, needsReview } = await userListingService.updateListing(
      req.params.id,
      req.user,
      req.parsed.data,
      req.files
    );
    res.status(200).json({
      success: true,
      message: needsReview
        ? "Listing updated — it will be visible again after review"
        : "Listing updated successfully",
      needsReview,
      data: listing,
    });
  } catch (err) {
    next(err);
  }
};

const deleteListing = async (req, res, next) => {
  try {
    await userListingService.deleteListing(req.params.id, req.user);
    res.status(200).json({ success: true, message: "Listing soft-deleted successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyListings,
  getPreview,
  createListing,
  updateListing,
  deleteListing,
};
