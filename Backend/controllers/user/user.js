const User = require("../../models/user");
const AppError = require("../../utils/AppError");

const putUser = async (req, res, next) => {
  try {
    const updateData = { ...req.parsed.data };

    delete updateData.role;
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

const createAddress = async (req, res, next) => {
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

const updatedAddress = async (req, res, next) => {
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

const removeAddress = async (req, res, next) => {
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

module.exports = {
  putUser,
  createAddress,
  updatedAddress,
  removeAddress,
};
