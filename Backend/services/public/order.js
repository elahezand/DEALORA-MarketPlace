const Order = require("../../models/order");
const AppError = require("../../utils/AppError");
const { verifyPayment } = require("../shared/zarinpal");
const { finalizeOrder } = require("../shared/order");

const STALE_CLAIM_MS = 2 * 60 * 1000;

const isFinished = (order) =>
  order.items
    .filter((i) => !i.cancelledAt)
    .every((i) => i.stockReserved && (!i.store || (i.store && i.walletCredited)));

const toRial = (toman) => Math.round(Number(toman || 0) * 10);

const verify = async (authority) => {
  if (!authority) throw new AppError(400, "Missing payment authority");
  const order = await Order.findOne({ "payment.authority": authority });
  if (!order) throw new AppError(404, "Order not found");

  if (order.paymentStatus === "paid") {
    if (isFinished(order)) return order;

    await finalizeOrder(order);
    await order.save();
    return order;
  }

  const staleBefore = new Date(Date.now() - STALE_CLAIM_MS);
  const claimed = await Order.findOneAndUpdate(
    {
      "payment.authority": authority,
      paymentStatus: { $ne: "paid" },
      status: { $ne: "cancelled" },
      $or: [{ finalizedAt: null }, { finalizedAt: { $lt: staleBefore } }],
    },
    { $set: { finalizedAt: new Date() } },
    { returnDocument: "after" }
  );
  if (!claimed) return order;

  const result = await verifyPayment(authority, toRial(claimed.pricing.total));

  if (!result.success && result.unreachable) {
    claimed.finalizedAt = null;
    await claimed.save();
    return claimed;
  }

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
