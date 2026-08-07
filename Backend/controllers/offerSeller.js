const service = require("../services/offerSeller");

// CREATE
exports.createOffer = async (req, res, next) => {
  try {
    const offer = await service.createOffer(req.user._id, req.parsed.data);
    res.status(201).json({ message: "Offer created", offer });
  } catch (err) {
    next(err);
  }
};

//EDIT OFFER
exports.updateOffer = async (req, res, next) => {
  try {
    const offer = await service.editOffer(req.user._id, req.parsed.data);
    res.status(201).json({ message: "Offer UDpdated", offer });
  } catch (err) {
    next(err);
  }
};

// GET ALL
exports.getAllOffers = async (req, res, next) => {
  try {
    const data = await service.getAll(req.query);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

// GET MINE
exports.getMyOffers = async (req, res, next) => {
  try {
    const data = await service.getMine(req.user._id, req.query);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

// DELETE
exports.deleteOffer = async (req, res, next) => {
  try {
    await service.remove(req.params.offerId, req.user);
    res.status(200).json({ message: "Offer deleted" });
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

    res.status(200).json({ message: "Offer processed", offer });
  } catch (err) {
    next(err);
  }
};