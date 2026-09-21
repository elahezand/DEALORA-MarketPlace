const adminListingService = require("../../services/admin/listing");

const getAllAdmin = async (req, res, next) => {
  try {
    const result = await adminListingService.getAllListingsAdmin(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const changeStatus = async (req, res, next) => {
  try {
    const listing = await adminListingService.changeStatus(
      req.params.id,
      req.body.status
    );

    res.status(200).json({
      success: true,
      message: `Listing status updated to ${req.body.status}`,
      data: listing,
    });
  } catch (err) {
    next(err);
  }
};

const getPreview = async (req, res, next) => {
  try {
    const result = await adminListingService.getListingPreview(req.params.id);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const createStoreProduct = async (req, res, next) => {
  try {
    const listing = await adminListingService.createStoreProduct(req.parsed.data, req.files);
    res.status(201).json({
      success: true,
      message: "Store product created successfully",
      data: listing,
    });
  } catch (err) {
    next(err);
  }
};

const updateListing = async (req, res, next) => {
  try {
    const { listing } = await adminListingService.updateListing(req.params.id, req.parsed.data, req.files);
    res.status(200).json({
      success: true,
      message: "Listing updated successfully",
      needsReview: false,
      data: listing,
    });
  } catch (err) {
    next(err);
  }
};

const deleteListing = async (req, res, next) => {
  try {
    await adminListingService.deleteListing(req.params.id);
    res.status(200).json({ success: true, message: "Listing soft-deleted successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPreview,
  createStoreProduct,
  updateListing,
  deleteListing,
  getAllAdmin,
  changeStatus,
};
