const Cart = require("../../models/cart");
const AppError = require("../../utils/AppError");
const { paginate } = require("../../utils/helper");
const { buildDateFilter, getAdminSort } = require("../../utils/adminQuery");
const { buildCartView } = require("../shared/cart");


const getAdminCarts = async (query = {}) => {
  const limit = Math.min(Number(query.limit) || 15, 100);
  const filters = {};
  Object.assign(filters, buildDateFilter(query, "createdAt"));
  return paginate(Cart, {
    limit, cursor: query.cursor, filters, populate: "user items.productId", sort: getAdminSort(query, ["createdAt", "updatedAt"])
  });
};

const getCartById = async (id) => {
  const cart = await Cart.findById(id).populate("user", "name email phone");
  if (!cart) throw new AppError(404, "Cart not found");
  return buildCartView(cart, { prune: false });
};

const deleteCart = async (id) => {
  const cart = await Cart.findByIdAndDelete(id);
  if (!cart) throw new AppError(404, "Cart not found");
  return true;
};

module.exports = {
  getAdminCarts,
  getCartById,
  deleteCart,
};
