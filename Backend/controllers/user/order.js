const userOrderService = require("../../services/user/order");

const checkout = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { shippingAddress, paymentMethod, idempotencyKey, useWallet } = req.parsed.data;

    // the receiver's phone: from the form, otherwise the buyer's own number
    const address = { ...shippingAddress, phone: shippingAddress.phone || req.user.phone || null };

    const result = await userOrderService.checkout(
      userId,
      address,
      paymentMethod,
      idempotencyKey || req.get("Idempotency-Key") || null,
      useWallet === true
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
      req.user._id,
      req.parsed?.data?.group || null
    );

    res.status(200).json({
      success: true,
      message: order.status === "completed"
        ? "Order marked as received"
        : "Thanks! Receipt confirmed",
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

const cancelItem = async (req, res, next) => {
  try {
    const { order, refund } = await userOrderService.cancelMyItem(
      req.params.id,
      req.user._id,
      req.params.itemId
    );

    res.status(200).json({
      success: true,
      message: refund > 0 ? `Item cancelled — ${refund} was refunded to your wallet` : "Item cancelled",
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
  cancelItem,
};
