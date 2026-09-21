const publicListingService = require("../../services/public/listing");
const AppError = require("../../utils/AppError");

const getAll = async (req, res, next) => {
  try {
    const result = await publicListingService.getAllListings(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

/* === AI SEARCH (PUBLIC) === */
const handleSmartSearch = async (req, res, next) => {
  try {
    const { prompt, budget } = req.body;

    if (!prompt) {
      return next(new AppError(400, "Search prompt is required."));
    }

    const result = await publicListingService.smartSearch({ prompt, budget });
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const result = await publicListingService.getListingById(req.params.id);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAll,
  handleSmartSearch,
  getOne,
};
