const service = require("../services/stores");

/*  PUBLIC  */
exports.getVerified = async (req, res, next) => {
  try {
    const data = await service.getVerifiedStores(req.query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/*  ADMIN  */
exports.getAll = async (req, res, next) => {
  try {
    const result = await service.getAllStores(req.query);
    res.status(200).json({ stores: result });
  } catch (err) {
    next(err);
  }
};

/*  SELLER  */
exports.get = async (req, res, next) => {
  try {
    const seller = await service.getStoresByOwner(req.user._id);
    return res.status(201).json({ seller });
  } catch (err) {
    return next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const newSeller = await service.createStore(req.user._id, req.parsed.data);
    return res.status(201).json({ message: "", seller: newSeller });
  } catch (err) {
    return next(err);
  }
};

exports.updateStore = async (req, res, next) => {
  try {
    await service.updateStore(req.user._id, req.params.id, req.parsed.data);
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
};

exports.verifyStore = async (req, res, next) => {
  try {
    const isVerified =
      typeof req.body?.isVerified === "boolean" ? req.body.isVerified : true;

    const store = await service.verifyStore(req.params.id, isVerified);

    return res.status(200).json({
      success: true,
      message: isVerified ? "Store verified" : "Store verification revoked",
      data: store,
    });
  } catch (err) {
    return next(err);
  }
};

exports.deleteStore = async (req, res, next) => {
  try {
    await service.deleteStore(req.user._id, req.params.id);
    return res.status(200).json({ message: "Seller deleted successfully" });
  } catch (err) {
    return next(err);
  }
};