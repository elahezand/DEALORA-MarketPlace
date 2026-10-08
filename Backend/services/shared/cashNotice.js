/* notifications for the cash-on-delivery "did you receive the cash?" flow */
const User = require("../../models/user");
const notifyUser = require("../../utils/notify");

const shortId = (order) => String(order._id).slice(-6).toUpperCase();

const notifyAdmins = async (msg, opts) => {
  const admins = await User.find({ role: "ADMIN" }).select("_id").lean();
  for (const admin of admins) await notifyUser(admin._id, msg, opts);
};

/** after reportCashNotReceived: tell the buyer (cancelled) or the admins (dispute) */
const notifyCashNotReceived = async (order, outcome) => {
  const id = shortId(order);
  if (outcome === "cancelled") {
    await notifyUser(
      order.user,
      `Order #${id} was cancelled because the payment wasn't received on delivery. If you did pay, contact support.`,
      { type: "order_status", link: `/dashboard/orders/${order._id}` }
    );
    await notifyAdmins(`Cash order #${id} was cancelled: the cash was reported as not received.`, {
      type: "cod_dispute",
      link: `/dashboard/admin/transactions/${order._id}`,
    });
    return;
  }

  await notifyAdmins(
    `Cash dispute on order #${id}: the cash was reported as not received` +
      (order.buyerConfirmedAt ? ", but the buyer confirmed receipt" : "") +
      ". Please review.",
    { type: "cod_dispute", link: `/dashboard/admin/transactions/${order._id}` }
  );
};

module.exports = { notifyCashNotReceived, notifyAdmins };
