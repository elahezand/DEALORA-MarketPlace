const sellerOrderService = require("../../services/seller/order");
const getSeller = async (req, res, next) => {
  try {
    const result = await sellerOrderService.getSellerOrders(req.user._id, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};
const sellerShipItem = async (req, res, next) => {
  try {
    const order = await sellerOrderService.sellerShipItem(
      req.user._id,
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

module.exports = {
  getSeller,
  sellerShipItem,
};
