const adminOrderService = require("../../services/admin/order");

const adminShipItem = async (req, res, next) => {
  try {
    const order = await adminOrderService.adminShipItem(
      req.params.id,
      req.params.itemId,
      req.parsed.data.trackingCode
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

const getStuckOrders = async (req, res, next) => {
  try {
    const result = await adminOrderService.getStuckOrders();
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const repairOrder = async (req, res, next) => {
  try {
    const order = await adminOrderService.repairOrder(req.params.id);
    res.status(200).json({ success: true, message: "Order finalized", data: order });
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

module.exports = {
  runAutoComplete,
  getStuckOrders,
  repairOrder,
  getAdmin,
  getByIdAdmin,
  patchAdmin,
  adminShipItem,
};
