const adminOfferSellerService = require("../../services/admin/offerSeller");

const getAllOffers = async (req, res, next) => {
  try {
    const result = await adminOfferSellerService.getAll(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const approveOffer = async (req, res, next) => {
  try {
    const offer = await adminOfferSellerService.approve(
      req.params.offerId,
      req.user._id,
      req.parsed.data
    );

    res.status(200).json({ success: true, message: "Offer processed", data: offer });
  } catch (err) {
    next(err);
  }
};

const deleteOffer = async (req, res, next) => {
  try {
    await adminOfferSellerService.remove(req.params.offerId);
    res.status(200).json({ success: true, message: "Offer deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  deleteOffer,
  getAllOffers,
  approveOffer,
};
