const adminStoresService = require("../../services/admin/stores");

const getAll = async (req, res, next) => {
  try {
    const result = await adminStoresService.getAllStores(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const verifyStore = async (req, res, next) => {
  try {
    const isVerified =
      typeof req.body?.isVerified === "boolean" ? req.body.isVerified : true;

    const store = await adminStoresService.verifyStore(req.params.id, isVerified);

    return res.status(200).json({
      success: true,
      message: isVerified ? "Store verified" : "Store verification revoked",
      data: store,
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getAll,
  verifyStore,
};
