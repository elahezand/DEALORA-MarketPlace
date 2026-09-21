const Notification = require("../../models/notification");
const User = require("../../models/user");
const AppError = require("../../utils/AppError");

const create = async (data) => {
  const recipient = await User.findById(data.user).select("_id role").lean();
  if (!recipient) {
    throw new AppError(404, "Admin not found");}

  if (!recipient.role?.includes("ADMIN")) {
    throw new AppError(400, "That user is not an admin");
  }
  return await Notification.create({ msg: data.msg, user: recipient._id });
};

module.exports = {
  create,
};
