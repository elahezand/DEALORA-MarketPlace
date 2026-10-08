const publicOrderService = require("../../services/public/order");

const logger = require("../../utils/logger");

const clientUrl = () => (process.env.CLIENT_URL || "http://localhost:3000").replace(/\/$/, "");

// The buyer lands here from the gateway in a browser tab, so every outcome is a redirect,
// never a JSON error page.
const verify = async (req, res) => {
  const { Authority, Status } = req.query;

  if (Status !== "OK" || !Authority) {
    return res.redirect(`${clientUrl()}/payment-failed`);
  }

  try {
    const order = await publicOrderService.verify(String(Authority));

    if (order.paymentStatus !== "paid") {
      return res.redirect(`${clientUrl()}/payment-failed?orderId=${order._id}`);
    }
    return res.redirect(`${clientUrl()}/payment-success?orderId=${order._id}`);
  } catch (err) {
    logger.error(`payment verify failed for authority ${Authority}:`, err);
    return res.redirect(`${clientUrl()}/payment-failed`);
  }
};

module.exports = {
  verify,
};
