const listingService = require("../services/listing");

/* === PUBLIC === */
exports.getAll = async (req, res, next) => {
  try {
    const result = await listingService.getAllListings(req.query);    
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

/* === ADMIN === */
exports.getAllAdmin = async (req, res, next) => {
  try {
    const result = await listingService.getAllListingsAdmin(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

/* === AI SEARCH (PUBLIC) === */
exports.handleSmartSearch = async (req, res, next) => {
  try {
    const { prompt, budget } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: "Search prompt is required." });
    }

    const result = await listingService.smartSearch({ prompt, budget });
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
exports.getOne = async (req, res, next) => {
  try {
    const data = await listingService.getListingById(req.params.id, req.query);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

/* === USER / SELLER === */
exports.getMyListings = async (req, res, next) => {
  try {
    const data = await listingService.getMyListings(req.user._id);    
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.createListing = async (req, res, next) => {
  try {
    const listing = await listingService.createListing(
      req.user._id,
      req.parsed.data,
      req.files
    );

    res.status(201).json({
      success: true,
      message: "Listing created successfully",
      data: listing,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateListing = async (req, res, next) => {
  try {
    const listing = await listingService.updateListing(
      req.params.id,
      req.user._id,
      req.parsed.data,
      req.files
    );

    res.status(200).json({
      success: true,
      message: "Listing updated successfully",
      data: listing,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteListing = async (req, res, next) => {
  try {
    await listingService.deleteListing(req.params.id, req.user._id);
    res.status(200).json({
      success: true,
      message: "Listing soft-deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

/* === ADMIN === */
exports.changeStatus = async (req, res, next) => {
  try {
    const listing = await listingService.changeStatus(
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