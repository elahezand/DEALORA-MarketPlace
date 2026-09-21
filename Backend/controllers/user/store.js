const userStoresService = require("../../services/user/stores");

const create = async (req, res, next) => {
  try {
    const newSeller = await userStoresService.createStore(req.user._id, req.parsed.data);
    return res.status(201).json({
      success: true,
      message: "Store created successfully",
      data: newSeller,
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  create,
};
