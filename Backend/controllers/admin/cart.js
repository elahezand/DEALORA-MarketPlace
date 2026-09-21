const adminCartService = require("../../services/admin/cart");

const getAdmin = async (req, res, next) => {
  try {
    const result = await adminCartService.getAdminCarts(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
};

const getByIdAdmin = async (req, res, next) => {
  try {
    const cart = await adminCartService.getCartById(req.params.id);
    res.status(200).json({ success: true, data: cart });
  } catch (e) {
    next(e);
  }
};

const remove = async (req, res, next) => {
  try {
    await adminCartService.deleteCart(req.params.id);
    res.status(200).json({ success: true, message: "Cart removed successfully" });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  getAdmin,
  getByIdAdmin,
  remove,
};
