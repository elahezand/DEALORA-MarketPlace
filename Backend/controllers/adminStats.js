
const User = require("../models/user");
const Store = require("../models/store");
const Order = require("../models/order"); 

exports.getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalStores, totalOrders, verifiedStores] =
      await Promise.all([
        User.countDocuments(),
        Store.countDocuments(),
        Order.countDocuments(),
        Store.countDocuments({ isVerified: true }),
      ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalStores,
        totalOrders,
        pendingStoreVerifications: totalStores - verifiedStores,
      },
    });
  } catch (err) {
    next(err);
  }
};