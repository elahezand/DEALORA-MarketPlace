const FavoriteServices = require("../services/wishList");

exports.getUserFavorites = async (req, res, next) => {
  try {
    const favorites = await FavoriteServices.getUserFavorites(
      req.user._id,
      req.query
    );

    res.status(200).json(favorites);
  } catch (err) {
    next(err);
  }
};

exports.getFavoriteCount = async (req, res, next) => {
  try {
    const count = await FavoriteServices.getFavoriteCount(req.user._id);

    res.status(200).json({ count });
  } catch (err) {
    next(err);
  }
};

exports.addFavorite = async (req, res, next) => {
  try {
    const favorite = await FavoriteServices.addFavorite(
      req.user._id,
      req.body.productId,
      req.body.productType
    );

    res.status(201).json(favorite);
  } catch (err) {
    next(err);
  }
};

exports.removeFavorite = async (req, res, next) => {
  try {
    await FavoriteServices.removeFavorite(
      req.user._id,
      req.params.productId
    );

    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

exports.toggleFavorite = async (req, res, next) => {
  try {
    const result = await FavoriteServices.toggleFavorite(
      req.user._id,
      req.params.productId,
      req.body.productType
    );

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

exports.isFavorited = async (req, res, next) => {
  try {
    const isFavorited = await FavoriteServices.isFavorited(
      req.user._id,
      req.params.productId
    );

    res.status(200).json({ isFavorited });
  } catch (err) {
    next(err);
  }
};

exports.checkFavorites = async (req, res, next) => {
  try {
    const favorites = await FavoriteServices.checkFavorites(
      req.user._id,
      req.query.productIds || []
    );

    res.status(200).json([...favorites]);
  } catch (err) {
    next(err);
  }
};

exports.filterByType = async (req, res, next) => {
  try {
    const favorites = await FavoriteServices.filterFavoritesByType(
      req.user._id,
      req.params.type,
      req.query
    );

    res.status(200).json(favorites);
  } catch (err) {
    next(err);
  }
};

exports.getPopular = async (req, res, next) => {
  try {
    const products = await FavoriteServices.getPopularProducts(req.query);

    res.status(200).json(products);
  } catch (err) {
    next(err);
  }
};