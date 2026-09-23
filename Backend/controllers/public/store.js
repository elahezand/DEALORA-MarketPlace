const publicStoresService = require("../../services/public/stores");

const getVerified = async (req, res, next) => {
  try {
    const result = await publicStoresService.getVerifiedStores(req.query);    
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getBySlug = async (req, res, next) => {
  try {
    const result = await publicStoresService.getStoreBySlug(req.params.slug, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getVerified,
  getBySlug,
};
