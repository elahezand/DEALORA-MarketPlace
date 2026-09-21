const userCartService = require("../../services/user/cart");

const getMyCart = async (req, res, next) => {
  try {
    const cart = await userCartService.getUserCart(req.user._id);
    res.status(200).json({ success: true, data: cart });
  } catch (e) {
    next(e);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const cart = await userCartService.addToCart(
      req.user._id,
      req.parsed?.data?.items || []
    );
    res.status(200).json({ success: true, data: cart });
  } catch (e) {
    next(e);
  }
};

const removeFromCart = async (req, res, next) => {
  try {
    const cart = await userCartService.removeFromCart(
      req.user._id,
      req.params.offerId
    );
    res.status(200).json({ success: true, data: cart });
  } catch (e) {
    next(e);
  }
};

const updateCart = async (req, res, next) => {
  try {
    const cart = await userCartService.updateCart(
      req.user._id,
      req.parsed?.data || {}
    );
    res.status(200).json({ success: true, data: cart });
  } catch (e) {
    next(e);
  }
};

const clearMyCart = async (req, res, next) => {
  try {
    await userCartService.clearCart(req.user._id);
    res.status(200).json({ success: true, message: "Cart cleared successfully" });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  getMyCart,
  addToCart,
  removeFromCart,
  updateCart,
  clearMyCart,
};
