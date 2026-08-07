const User = require("../models/user");
const Ban = require("../models/ban");
const paginate = require("../utils/helper");

exports.getAllUsers = async (req, res, next) => {
  try {
    const { limit, cursor } = req.query;

    if (limit && Number(limit) > 50) {
      return res.status(400).json({ message: "Limit must be <= 50" });
    }

    const result = await paginate(User, { limit, cursor });
    return res.status(200).json({ users: result });
  } catch (err) {
    next(err);
  }
};

exports.postNewUser = async (req, res, next) => {
  try {
    const { phone, isSeller } = req.parsed.data;

    const isBanUser = await Ban.exists({ phone });
    if (isBanUser) {
      return res.status(403).json({ message: "User is banned" });
    }

    const isUserExist = await User.exists({ phone });
    if (isUserExist) {
      return res.status(409).json({ message: "User already exists" });
    }

    const usersCount = await User.countDocuments();
    const userRole = usersCount < 3 ? ["ADMIN"] : isSeller ? ["USER", "SELLER"] : ["USER"];

    const newUser = await User.create({
      phone,
      role: userRole,
    });

    return res.status(201).json({ message: "User created successfully", user: newUser });
  } catch (err) {
    next(err);
  }
};

exports.putUser = async (req, res, next) => {
  try {
    const updateData = { ...req.parsed.data };

    if (req.file) {
      updateData.profilePicture = `/users/avatars/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
  } catch (err) {
    next(err);
  }
};

exports.toggleBan = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const user = await User.findById(targetUserId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role.includes("ADMIN")) {
      return res.status(400).json({ message: "Cannot ban an ADMIN user" });
    }

    const existingBan = await Ban.findOne({ phone: user.phone });
    if (existingBan) {
      await Ban.deleteOne({ phone: user.phone });
      return res.status(200).json({ message: "User unbanned successfully" });
    }

    await Ban.create({ phone: user.phone });
    return res.status(200).json({ message: "User banned successfully" });
  } catch (err) {
    next(err);
  }
};

exports.toggleRole = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const user = await User.findById(targetUserId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = user.role.includes("ADMIN") ? ["USER"] : ["ADMIN"];
    await user.save();

    return res.status(200).json({ message: "Role updated successfully", role: user.role });
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
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Address added successfully",
      addresses: updatedUser.addresses,
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
    if (!user) return res.status(404).json({ message: "User not found" });

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    address.set(updateData);
    await user.save();

    return res.status(200).json({
      message: "Address updated successfully",
      address,
    });
  } catch (err) {
    next(err);
  }
};

exports.removeAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    user.addresses.pull(addressId);
    await user.save();

    return res.status(200).json({
      message: "Address removed successfully",
      addresses: user.addresses,
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
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User removed successfully" });
  } catch (err) {
    next(err);
  }
};