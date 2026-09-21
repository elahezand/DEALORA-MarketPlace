const userWishListService = require("../../services/user/wishList");

const getUserFavorites = async (req, res, next) => {
  try {
    const result = await userWishListService.getUserFavorites(
      req.user._id,
      req.query
    );

    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getFavoriteCount = async (req, res, next) => {
  try {
    const count = await userWishListService.getFavoriteCount(req.user._id);

    res.status(200).json({ success: true, data: { count } });
  } catch (err) {
    next(err);
  }
};

const addFavorite = async (req, res, next) => {
  try {
    const favorite = await userWishListService.addFavorite(
      req.user._id,
      req.body.productId,
      req.body.productType
    );

    res.status(201).json({ success: true, message: "Added to favorites", data: favorite });
  } catch (err) {
    next(err);
  }
};

const removeFavorite = async (req, res, next) => {
  try {
    await userWishListService.removeFavorite(
      req.user._id,
      req.params.productId
    );

    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

const toggleFavorite = async (req, res, next) => {
  try {
    const result = await userWishListService.toggleFavorite(
      req.user._id,
      req.params.productId,
      req.body.productType
    );

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const isFavorited = async (req, res, next) => {
  try {
    const isFavorited = await userWishListService.isFavorited(
      req.user._id,
      req.params.productId
    );

    res.status(200).json({ success: true, data: { isFavorited } });
  } catch (err) {
    next(err);
  }
};

const checkFavorites = async (req, res, next) => {
  try {
    const favorites = await userWishListService.checkFavorites(
      req.user._id,
      req.query.productIds || []
    );

    res.status(200).json({ success: true, data: [...favorites] });
  } catch (err) {
    next(err);
  }
};

const filterByType = async (req, res, next) => {
  try {
    const result = await userWishListService.filterFavoritesByType(
      req.user._id,
      req.params.type,
      req.query
    );

    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUserFavorites,
  getFavoriteCount,
  checkFavorites,
  filterByType,
  isFavorited,
  addFavorite,
  toggleFavorite,
  removeFavorite,
};
