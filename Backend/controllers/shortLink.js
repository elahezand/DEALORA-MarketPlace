const Product = require("../models/product");

exports.redirectToProduct = async (req, res, next) => {
  try {
    const { shortIdentifier } = req.params;

    if (!shortIdentifier) {
      return next({ status: 400, message: "shortIdentifier is required" });
    }
    const product = await Product.findOne({ shortIdentifier }).lean();

    if (!product) {
      return next({ status: 404, message: "Product not found" });
    }

    return res.status(200).json({ data: product });
  } catch (err) {
    return next(err);
  }
};