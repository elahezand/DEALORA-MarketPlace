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

module.exports = {
  getAdmin,
  getByIdAdmin,
  patchAdmin,
  adminShipItem,
};
