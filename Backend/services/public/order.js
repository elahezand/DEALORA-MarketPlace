const Order = require("../../models/order");
const AppError = require("../../utils/AppError");
const { verifyPayment } = require("../shared/zarinpal");
const { finalizeOrder } = require("../shared/order");

// a claim older than this is treated as a crashed run and may be retried
const STALE_CLAIM_MS = 2 * 60 * 1000;

const isFinished = (order) =>
  order.items.every((i) => i.stockReserved && (!i.store || i.walletCredited));

const verify = async (authority) => {
  const order = await Order.findOne({ "payment.authority": authority });
  if (!order) throw new AppError(404, "Order not found");

  if (order.paymentStatus === "paid") {
    if (isFinished(order)) return order;

    await finalizeOrder(order);
    await order.save();
    return order;
  }

  // only one request may run the payment + finalize at a time
  const staleBefore = new Date(Date.now() - STALE_CLAIM_MS);
  const claimed = await Order.findOneAndUpdate(
    {
      "payment.authority": authority,
      paymentStatus: { $ne: "paid" },
      $or: [{ finalizedAt: null }, { finalizedAt: { $lt: staleBefore } }],
    },
    { $set: { finalizedAt: new Date() } },
    { returnDocument: "after" }
  );
  if (!claimed) return order;

  const result = await verifyPayment(authority, claimed.pricing.total * 10);

  if (!result.success) {
    claimed.finalizedAt = null; 
    claimed.paymentStatus = "failed";
    await claimed.save();
    return claimed;
  }

  // mark paid BEFORE the rest: if the server dies now, the next call resumes above
  claimed.paymentStatus = "paid";
  claimed.payment.refId = result.refId;
  claimed.payment.paidAt = new Date();
  await claimed.save();

  await finalizeOrder(claimed);
  await claimed.save();
  return claimed;
};

module.exports = {
  verify,
};
