const publicWishListService = require("../../services/public/wishList");

const getPopular = async (req, res, next) => {
  try {
    const products = await publicWishListService.getPopularProducts(req.query);

    res.status(200).json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPopular,
};
