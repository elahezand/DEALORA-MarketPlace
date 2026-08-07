const User = require("../models/user");

const addAddressService = async (userId, addressData) => {
    return await User.findByIdAndUpdate(
        userId,
        { $push: { addresses: addressData } },
        { new: true }
    );
};

const updateAddressService = async (userId, addressId, updateData) => {
    return await User.findOneAndUpdate(
        { _id: userId, "addresses._id": addressId },
        { $set: { "addresses.$": { ...updateData, _id: addressId } } },
        { new: true }
    );
};

const removeAddressService = async (userId, addressId) => {
    return await User.findByIdAndUpdate(
        userId,
        { $pull: { addresses: { _id: addressId } } },
        { new: true }
    );
};

module.exports = { addAddressService, updateAddressService, removeAddressService };