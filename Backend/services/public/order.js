const Order = require("../../models/order");
const AppError = require("../../utils/AppError");
const { verifyPayment } = require("../shared/zarinpal");
const { finalizeOrder } = require("../shared/order");

const verify = async (authority) => {
  const order = await Order.findOne({ "payment.authority": authority });
  if (!order) throw new AppError(404, "Order not found");

  if (order.paymentStatus === "paid") return order;

  const result = await verifyPayment(authority, order.pricing.total * 10);

  if (!result.success) {
    order.paymentStatus = "failed";
    await order.save();
    return order;
  }

  order.paymentStatus = "paid";
  order.payment.refId = result.refId;
  order.payment.paidAt = new Date();

  await finalizeOrder(order);
  await order.save();
  return order;
};

module.exports = {
  verify,
};
