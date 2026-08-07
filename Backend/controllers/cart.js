const cartService = require("../services/cart");

/* ─── ADMIN  */

exports.getAdmin = async (req, res, next) => {
  try {
    const carts = await cartService.getAdminCarts(req.query);
    res.status(200).json({ success: true, data: carts });
  } catch (e) {
    next(e);
  }
};

exports.getByIdAdmin = async (req, res, next) => {
  try {
    const cart = await cartService.getCartById(req.params.id);
    res.status(200).json({ success: true, data: cart });
  } catch (e) {
    next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await cartService.deleteCart(req.params.id);
    res.status(200).json({ success: true, message: "Cart removed successfully" });
  } catch (e) {
    next(e);
  }
};

/* ─── USER  */

exports.getMyCart = async (req, res, next) => {
  try {
    const cart = await cartService.getUserCart(req.user._id);
    res.status(200).json({ success: true, data: cart });
  } catch (e) {
    next(e);
  }
};

exports.addToCart = async (req, res, next) => {
  try {
    const cart = await cartService.addToCart(
      req.user._id,
      req.parsed?.data?.items || []
    );
    res.status(200).json({ success: true, data: cart });
  } catch (e) {
    next(e);
  }
};

exports.removeFromCart = async (req, res, next) => {
  try {
    const cart = await cartService.removeFromCart(
      req.user._id,
      req.params.offerId
    );
    res.status(200).json({ success: true, data: cart });
  } catch (e) {
    next(e);
  }
};

exports.updateCart = async (req, res, next) => {
  try {
    const cart = await cartService.updateCart(
      req.user._id,
      req.parsed?.data || {}
    );
    res.status(200).json({ success: true, data: cart });
  } catch (e) {
    next(e);
  }
};

exports.clearMyCart = async (req, res, next) => {
  try {
    await cartService.clearCart(req.user._id);
    res.status(200).json({ success: true, message: "Cart cleared successfully" });
  } catch (e) {
    next(e);
  }
};