const sellerStoresService = require("../../services/seller/stores");

const get = async (req, res, next) => {
  try {
    const stores = await sellerStoresService.getStoresByOwner(req.user._id);
    return res.status(200).json({ success: true, data: stores });
  } catch (err) {
    return next(err);
  }
};

const updateStore = async (req, res, next) => {
  try {
    await sellerStoresService.updateStore(req.user._id, req.params.id, req.parsed.data);
    return res.status(200).json({ success: true, message: "Store updated successfully" });
  } catch (err) {
    return next(err);
  }
};

const deleteStore = async (req, res, next) => {
  try {
    await sellerStoresService.deleteStore(req.user._id, req.params.id);
    return res.status(200).json({ success: true, message: "Seller deleted successfully" });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  get,
  updateStore,
  deleteStore,
};
