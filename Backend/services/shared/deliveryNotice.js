/* tells the buyer when their order ships and when it should arrive */
const Notification = require("../../models/notification");
const notifyUser = require("../../utils/notify");
const logger = require("../../utils/logger");

// messages are written for the buyer's clock, not the server's (the server usually runs in UTC)
const TIME_ZONE = process.env.APP_TIMEZONE || "Asia/Tehran";

const formatArrival = (date) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(date)).replace(/, (\d{2}:\d{2})$/, " at $1");

const shortId = (order) => String(order._id).slice(-6).toUpperCase();

// shipping several items one request each would otherwise send the same message several times
const DEDUPE_MS = 2 * 60 * 1000;

const sendOnce = async (userId, msg, opts) => {
  try {
    const recent = await Notification.exists({
      user: userId,
      msg,
      createdAt: { $gte: new Date(Date.now() - DEDUPE_MS) },
    });
    if (recent) return;
  } catch (err) {
    logger.warn("[deliveryNotice] dedupe check failed:", err);
  }
  await notifyUser(userId, msg, opts);
};

/** after an item was marked shipped */
const notifyItemShipped = async (order, item) => {
  const eta = item.fulfillment?.estimatedDeliveryAt;
  const tracking = item.fulfillment?.trackingCode;
  const whole = order.status === "shipped";

  const msg = [
    whole
      ? `Your order #${shortId(order)} has shipped.`
      : `Part of your order #${shortId(order)} has shipped (${item.productSnapshot?.title || "an item"}).`,
    eta ? `Expected delivery: ${formatArrival(eta)}.` : null,
    tracking ? `Tracking code: ${tracking}.` : null,
  ].filter(Boolean).join(" ");

  await sendOnce(order.user, msg, { type: "order_shipped", link: `/dashboard/orders/${order._id}` });
};

/** after the expected arrival of a shipped item was changed */
const notifyDeliveryUpdated = async (order, item) => {
  const eta = item.fulfillment?.estimatedDeliveryAt;
  if (!eta) return;
  const msg = `Delivery time for your order #${shortId(order)} was updated: now expected ${formatArrival(eta)}.`;
  await sendOnce(order.user, msg, { type: "delivery_update", link: `/dashboard/orders/${order._id}` });
};

module.exports = { notifyItemShipped, notifyDeliveryUpdated, formatArrival };
