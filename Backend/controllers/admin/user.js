const User = require("../../models/user");
const Ban = require("../../models/ban");
const { paginate } = require("../../utils/helper");
const AppError = require("../../utils/AppError");
const Session = require("../../models/session");
const Store = require("../../models/store");
const adminUserService = require("../../services/admin/user");
const { revokeAllUserSessions } = require("../../services/shared/session");

const getAllUsers = async (req, res, next) => {
  try {
    const result = await adminUserService.getAllUsers(req.query);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getAdmins = async (req, res, next) => {
  try {
    const admins = await User.find({ role: "ADMIN" })
      .select("username phone")
      .sort({ username: 1 })
      .lean();
    res.status(200).json({ success: true, data: admins });
  } catch (err) {
    next(err);
  }
};

const postNewUser = async (req, res, next) => {
  try {
    const { phone, role } = req.parsed.data;

    const isBanUser = await Ban.exists({ phone });
    if (isBanUser) {
      return next(new AppError(403, "User is banned"));
    }

    const isUserExist = await User.exists({ phone });
    if (isUserExist) {
      return next(new AppError(409, "User already exists"));
    }

    const usersCount = await User.countDocuments();
    const userRole =
      usersCount < 3
        ? ["ADMIN"]
        : Array.isArray(role) && role.length > 0
          ? role
          : ["USER"];

    const newUser = await User.create({
      phone,
      role: userRole,
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: newUser,
    });
  } catch (err) {
    next(err);
  }
};

const toggleBan = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const user = await User.findById(targetUserId);

    if (!user) {
      return next(new AppError(404, "User not found"));
    }

    if (user.role.includes("ADMIN")) {
      return next(new AppError(400, "Cannot ban an ADMIN user"));
    }

    const existingBan = await Ban.findOne({ phone: user.phone });
    if (existingBan) {
      await Ban.deleteOne({ phone: user.phone });
      return res.status(200).json({ success: true, message: "User unbanned successfully" });
    }

    await Ban.create({ phone: user.phone });
    // Kick the banned user out of every device immediately
    await revokeAllUserSessions(user._id, "banned");
    return res.status(200).json({ success: true, message: "User banned successfully" });
  } catch (err) {
    next(err);
  }
};

const toggleRole = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    if (String(targetUserId) === String(req.user._id)) {
      return next(new AppError(400, "You can't change your own admin role"));
    }

    const user = await User.findById(targetUserId);

    if (!user) {
      return next(new AppError(404, "User not found"));
    }

    if (user.role.includes("ADMIN")) {
      const adminCount = await User.countDocuments({ role: "ADMIN" });
      if (adminCount <= 1) {
        return next(new AppError(400, "The site needs at least one admin"));
      }
      user.role = user.role.filter((r) => r !== "ADMIN");
    } else {
      user.role = [...user.role, "ADMIN"];
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Role updated successfully",
      data: { role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

const removeUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    if (String(targetUserId) === String(req.user._id)) {
      return next(new AppError(400, "You can't delete your own account from here"));
    }

    const target = await User.findById(targetUserId).select("role wallet").lean();
    if (!target) {
      return next(new AppError(404, "User not found"));
    }
    if (target.role?.includes("ADMIN")) {
      return next(new AppError(400, "Remove the admin role before deleting this user"));
    }

    // a store with money in it can't lose its owner
    const store = await Store.findOne({ owner: targetUserId }).select("wallet").lean();
    if (store && ((store.wallet?.balance || 0) > 0 || (store.wallet?.pending || 0) > 0)) {
      return next(new AppError(409, "This user's store still holds money — settle it first"));
    }
    if ((target.wallet?.balance || 0) > 0) {
      return next(new AppError(409, "This user still has wallet balance — refund it first"));
    }

    const deletedUser = await User.findByIdAndDelete(targetUserId);
    if (!deletedUser) {
      return next(new AppError(404, "User not found"));
    }
    if (store) await Store.deleteOne({ _id: store._id });

    await revokeAllUserSessions(deletedUser._id, "user_deleted");
    await Session.deleteMany({ user: deletedUser._id });

    return res.status(200).json({ success: true, message: "User removed successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllUsers,
  getAdmins,
  postNewUser,
  toggleRole,
  toggleBan,
  removeUser,
};
