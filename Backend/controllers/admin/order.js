const adminOrderService = require("../../services/admin/order");

const adminShipItem = async (req, res, next) => {
  try {
    const order = await adminOrderService.adminShipItem(
      req.params.id,
      req.params.itemId,
      req.parsed.data.trackingCode,
      req.parsed.data.estimatedDeliveryAt || null
    );

    res.status(200).json({
      success: true,
      message: "Item marked as shipped",
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

const getAdmin = async (req, res, next) => {
  try {
    const result = await adminOrderService.getAllOrders(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getByIdAdmin = async (req, res, next) => {
  try {
    const order = await adminOrderService.getOrderByIdAdmin(req.params.id);

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

/* Patch Order (Admin) */
const patchAdmin = async (req, res, next) => {
  try {
    const order = await adminOrderService.updateOrder(
      req.params.id,
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

const runAutoComplete = async (req, res, next) => {
  try {
    const result = await adminOrderService.runAutoComplete();
    res.status(200).json({ success: true, message: "Order sweeps finished", data: result });
  } catch (err) {
    next(err);
  }
};

const adminConfirmCash = async (req, res, next) => {
  try {
    const { order, paid, completed } = await adminOrderService.adminConfirmCash(
      req.params.id,
      req.params.itemId,
      req.user._id
    );
    res.status(200).json({
      success: true,
      message: completed
        ? "Cash confirmed — order completed"
        : paid
          ? "Cash confirmed — the order is paid"
          : "Cash confirmed for this item",
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

const adminReportCashMissing = async (req, res, next) => {
  try {
    const { order, outcome } = await adminOrderService.adminReportCashMissing(
      req.params.id,
      req.params.itemId,
      req.user._id,
      req.parsed.data.note
    );
    res.status(200).json({
      success: true,
      message: outcome === "cancelled" ? "Order cancelled — the stock was returned" : "Marked as a cash dispute",
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

const adminCancelGroup = async (req, res, next) => {
  try {
    const order = await adminOrderService.adminCancelGroup(req.params.id, req.params.group);
    res.status(200).json({ success: true, message: "This part of the order was cancelled", data: order });
  } catch (err) {
    next(err);
  }
};

const adminCancelItem = async (req, res, next) => {
  try {
    const order = await adminOrderService.adminCancelItem(req.params.id, req.params.itemId);
    res.status(200).json({ success: true, message: "Item cancelled", data: order });
  } catch (err) {
    next(err);
  }
};

const adminSetDeliveryEstimate = async (req, res, next) => {
  try {
    const order = await adminOrderService.adminSetDeliveryEstimate(
      req.params.id,
      req.params.itemId,
      req.parsed.data.estimatedDeliveryAt
    );
    res.status(200).json({ success: true, message: "Delivery time updated", data: order });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  adminCancelGroup,
  adminCancelItem,
  adminSetDeliveryEstimate,
  adminConfirmCash,
  adminReportCashMissing,
  runAutoComplete,
  getAdmin,
  getByIdAdmin,
  patchAdmin,
  adminShipItem,
};