const orderService = require("../services/order");

/* Checkout (Cart → Order) */
exports.checkout = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { shippingAddress, paymentMethod } = req.body;

    const result = await orderService.checkout(
      userId,
      shippingAddress,
      paymentMethod
    );

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/* Verify Payment */
exports.verify = async (req, res, next) => {
  try {
    const { Authority, Status } = req.query;

    if (Status !== "OK") {
      return res.redirect(`${process.env.CLIENT_URL}/payment-failed`);
    }

    const order = await orderService.verify(Authority);

    return res.redirect(
      `${process.env.CLIENT_URL}/payment-success?orderId=${order._id}`
    );
  } catch (err) {
    next(err);
  }
};

/* Get My Orders (User) */
exports.getMyOrders = async (req, res, next) => {
  try {
    const data = await orderService.getMyOrders(req.user._id, req.query);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

/* Get Single Order (User) */
exports.getMyOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(
      req.params.id,
      req.user._id
    );

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

/* Admin Get All Orders */
exports.getAdmin = async (req, res, next) => {
  try {
    const result = await orderService.getAllOrders(req.query);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/* Admin Get Single Order */
exports.getByIdAdmin = async (req, res, next) => {
  try {
    const order = await orderService.getOrderByIdAdmin(req.params.id);

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

/* Patch Order */
exports.patch = async (req, res, next) => {
  try {
    const order = await orderService.updateOrder(
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

/* Cancel Order */
exports.cancel = async (req, res, next) => {
  try {
    const order = await orderService.cancelOrder(
      req.params.id,
      req.user._id
    );

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};