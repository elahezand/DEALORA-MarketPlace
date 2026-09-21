const userOrderService = require("../../services/user/order");

const checkout = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { shippingAddress, paymentMethod } = req.parsed.data;

    const result = await userOrderService.checkout(
      userId,
      shippingAddress,
      paymentMethod
    );

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    const result = await userOrderService.getMyOrders(req.user._id, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getMyOrderById = async (req, res, next) => {
  try {
    const order = await userOrderService.getOrderById(
      req.params.id,
      req.user._id
    );

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

const patch = async (req, res, next) => {
  try {
    const order = await userOrderService.updateOrderByOwner(
      req.params.id,
      req.user._id,
      req.parsed.data
    );

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

const cancel = async (req, res, next) => {
  try {
    const order = await userOrderService.cancelOrder(
      req.params.id,
      req.user._id
    );

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

const confirmDelivery = async (req, res, next) => {
  try {
    const order = await userOrderService.confirmDelivery(
      req.params.id,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: "Order marked as received",
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  checkout,
  getMyOrders,
  getMyOrderById,
  patch,
  cancel,
  confirmDelivery,
};
