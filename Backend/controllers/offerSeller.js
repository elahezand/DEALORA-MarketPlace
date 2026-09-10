const service = require("../services/offerSeller");

// CREATE
exports.createOffer = async (req, res, next) => {
  try {
    const offer = await service.createOffer(req.user._id, req.parsed.data);
    res.status(201).json({ success: true, message: "Offer created", data: offer });
  } catch (err) {
    next(err);
  }
};

//EDIT OFFER
exports.updateOffer = async (req, res, next) => {
  try {
    const offer = await service.updateOffer(
      req.user._id,
      req.params.offerId,
      req.parsed.data
    );
    res.status(200).json({ success: true, message: "Offer updated", data: offer });
  } catch (err) {
    next(err);
  }
};

// GET ALL
exports.getAllOffers = async (req, res, next) => {
  try {
    const result = await service.getAll(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// GET MINE
exports.getMyOffers = async (req, res, next) => {
  try {
    const result = await service.getMine(req.user._id, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// DELETE
exports.deleteOffer = async (req, res, next) => {
  try {
    await service.remove(req.params.offerId, req.user);
    res.status(200).json({ success: true, message: "Offer deleted" });
  } catch (err) {
    next(err);
  }
};

// APPROVE / REJECT
exports.approveOffer = async (req, res, next) => {
  try {
    const offer = await service.approve(
      req.params.offerId,
      req.user._id,
      req.parsed.data
    );

    res.status(200).json({ success: true, message: "Offer processed", data: offer });
  } catch (err) {
    next(err);
  }
};
