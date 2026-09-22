const sellerOfferSellerService = require("../../services/seller/offerSeller");

const getOfferableProducts = async (req, res, next) => {
  try {
    const result = await sellerOfferSellerService.getOfferableProducts(req.user._id, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};
const createOffer = async (req, res, next) => {
  try {
    const offer = await sellerOfferSellerService.createOffer(req.user._id, req.parsed.data);
    res.status(201).json({ success: true, message: "Offer created", data: offer });
  } catch (err) {
    next(err);
  }
};
const updateOffer = async (req, res, next) => {
  try {
    const offer = await sellerOfferSellerService.updateOffer(
      req.user._id,
      req.params.offerId,
      req.parsed.data
    );
    res.status(200).json({ success: true, message: "Offer updated", data: offer });
  } catch (err) {
    next(err);
  }
};
const getMyOffers = async (req, res, next) => {
  try {
    const result = await sellerOfferSellerService.getMine(req.user._id, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const deleteOffer = async (req, res, next) => {
  try {
    await sellerOfferSellerService.remove(req.params.offerId, req.user);
    res.status(200).json({ success: true, message: "Offer deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOfferableProducts,
  createOffer,
  getMyOffers,
  updateOffer,
  deleteOffer,
};
