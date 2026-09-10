const User = require("../models/user");
const Ban = require("../models/ban");
const { paginate } = require("../utils/helper");
const AppError = require("../utils/AppError");

exports.getAllUsers = async (req, res, next) => {
  try {
    const { limit, cursor } = req.query;

    if (limit && Number(limit) > 50) {
      return next(new AppError(400, "Limit must be <= 50"));
    }

    const result = await paginate(User, { limit, cursor });
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.getAdmins = async (req, res, next) => {
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


exports.postNewUser = async (req, res, next) => {
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

exports.putUser = async (req, res, next) => {
  try {
    const updateData = { ...req.parsed.data };
    // Never allow a user to change these on themselves via this endpoint,
    // regardless of what the validation schema currently allows.
    delete updateData.role;
    delete updateData.refreshToken;
    delete updateData.phone;

    if (req.file) {
      updateData.profilePicture = `/users/avatars/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return next(new AppError(404, "User not found"));
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};

exports.toggleBan = async (req, res, next) => {
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
    return res.status(200).json({ success: true, message: "User banned successfully" });
  } catch (err) {
    next(err);
  }
};

exports.toggleRole = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const user = await User.findById(targetUserId);

    if (!user) {
      return next(new AppError(404, "User not found"));
    }

    if (user.role.includes("ADMIN")) {
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

exports.createAddress = async (req, res, next) => {
  try {
    const addressData = req.parsed.data;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { addresses: addressData } },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return next(new AppError(404, "User not found"));
    }

    return res.status(200).json({
      success: true,
      message: "Address added successfully",
      data: updatedUser.addresses,
    });
  } catch (err) {
    next(err);
  }
};

exports.updatedAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const updateData = req.parsed.data;
    delete updateData._id;

    const user = await User.findById(req.user._id);
    if (!user) return next(new AppError(404, "User not found"));

    const address = user.addresses.id(addressId);
    if (!address) {
      return next(new AppError(404, "Address not found"));
    }

    address.set(updateData);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Address updated successfully",
      data: address,
    });
  } catch (err) {
    next(err);
  }
};

exports.removeAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) return next(new AppError(404, "User not found"));

    const address = user.addresses.id(addressId);
    if (!address) {
      return next(new AppError(404, "Address not found"));
    }

    user.addresses.pull(addressId);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Address removed successfully",
      data: user.addresses,
    });
  } catch (err) {
    next(err);
  }
};

exports.removeUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const deletedUser = await User.findByIdAndDelete(targetUserId);

    if (!deletedUser) {
      return next(new AppError(404, "User not found"));
    }

    return res.status(200).json({ success: true, message: "User removed successfully" });
  } catch (err) {
    next(err);
  }
};
