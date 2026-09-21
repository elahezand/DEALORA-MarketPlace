const publicOrderService = require("../../services/public/order");

const verify = async (req, res, next) => {
  try {
    const { Authority, Status } = req.query;

    if (Status !== "OK") {
      return res.redirect(`${process.env.CLIENT_URL}/payment-failed`);
    }

    const order = await publicOrderService.verify(Authority);

    return res.redirect(
      `${process.env.CLIENT_URL}/payment-success?orderId=${order._id}`
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  verify,
};
