const Store = require("../../models/store");
const UserModel = require("../../models/user");
const AppError = require("../../utils/AppError");

const createStore = async (userId, data) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new AppError(404, "NOT found");
  const newSeller = await Store.create({ ...data, owner: userId });

  try {
    await UserModel.findByIdAndUpdate(
      userId,
      { $addToSet: { role: "SELLER" } },
      { new: true }
    );
  } catch (err) {
    await Store.findByIdAndDelete(newSeller._id).catch(() => {});
    throw err;
  }

  return newSeller;
};

module.exports = {
  createStore,
};
