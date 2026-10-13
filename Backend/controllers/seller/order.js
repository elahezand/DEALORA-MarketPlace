const sellerOrderService = require("../../services/seller/order");
const getSeller = async (req, res, next) => {
  try {
    const result = await sellerOrderService.getSellerOrders(req.user._id, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};
const sellerShipOrder = async (req, res, next) => {
  try {
    const order = await sellerOrderService.sellerShipOrder(
      req.user._id,
      req.params.id,
      req.parsed.data.trackingCode,
      req.parsed.data.estimatedDeliveryAt || null
    );
    res.status(200).json({ success: true, message: "Your items were marked as shipped", data: order });
  } catch (err) {
    next(err);
  }
};

const sellerSetDeliveryEstimate = async (req, res, next) => {
  try {
    const order = await sellerOrderService.sellerSetDeliveryEstimate(
      req.user._id,
      req.params.id,
      req.parsed.data.estimatedDeliveryAt
    );
    res.status(200).json({ success: true, message: "Delivery time updated", data: order });
  } catch (err) {
    next(err);
  }
};

const sellerConfirmCash = async (req, res, next) => {
  try {
    const { order, paid, completed } = await sellerOrderService.sellerConfirmCash(req.user._id, req.params.id);
    res.status(200).json({
      success: true,
      message: completed
        ? "Cash confirmed — order completed"
        : paid
          ? "Cash confirmed — the order is paid and completes automatically"
          : "Cash confirmed for your items",
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

const sellerReportCashMissing = async (req, res, next) => {
  try {
    const { order, outcome } = await sellerOrderService.sellerReportCashMissing(
      req.user._id,
      req.params.id,
      req.parsed.data.note
    );
    res.status(200).json({
      success: true,
      message: outcome === "cancelled"
        ? "Order cancelled — the stock was returned"
        : "Reported — an admin will review this order",
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  sellerConfirmCash,
  sellerReportCashMissing,
  sellerSetDeliveryEstimate,
  getSeller,
  sellerShipOrder,
};