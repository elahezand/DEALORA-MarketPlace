const Store = require("../models/store");
const UserModel = require("../models/user");
const paginate = require("../utils/helper");

// controllers/store.js — fixed getAll (corrected populate field name)

exports.getAll = async (req, res, next) => {
  try {
    const { limit, cursor } = req.query;

    if (limit && Number(limit) > 50) {
      return res.status(400).json({ message: "limit must be <= 50" });
    }

    const result = await paginate(Store, {
      limit,
      cursor,
      populate: "owner",
    });

    res.status(200).json({ stores: result });
  } catch (err) {
    next(err);
  }
};
exports.get = async (req, res, next) => {
    try {
        const user = await UserModel.findById(req.user._id);
        if (!user) return next({ status: 404, message: "NOT found" });

        const shopsSeller = await Store.find({ user: req.user._id });
        if (!shopsSeller) return next({ status: 404, message: "NOT found" });

        return res.status(201).json({
            seller: shopsSeller,
        });
    } catch (err) {
        return next(err);
    }
};
exports.create = async (req, res, next) => {
    try {
        const user = await UserModel.findById(req.user._id);
        if (!user) return next({ status: 404, message: "NOT found" });
        const newSeller = await Store.create(req.parsed.data);

        try {
            await UserModel.findByIdAndUpdate(
                req.user._id,
                { $addToSet: { role: "SELLER" } },
                { new: true }
            );
        } catch (err) {
            await Store.findByIdAndDelete(newSeller._id).catch(() => { });
            return next(err);
        }
        return res.status(201).json({
            message: "",
            seller: newSeller,
        });
    } catch (err) {
        return next(err);
    }
};
exports.updateStore = async (req, res, next) => {
    try {
        const user = await UserModel.findById(req.user._id);
        if (!user) return next({ status: 404, message: "NOT found" });

        const existing = await Store.findById(req.params.id).lean();
        if (!existing) return next({ status: 404, message: "NOT found" });

        const merged = { ...existing, ...req.parsed.data };

        await Store.updateOne({ _id: req.params.id }, { $set: merged }).exec();
        return res.json({ ok: true });
    } catch (err) {
        return next(err);
    }
};
exports.verifyStore = async (req, res, next) => {
    try {
        const isVerified =
            typeof req.body?.isVerified === "boolean" ? req.body.isVerified : true;

        const store = await Store.findByIdAndUpdate(
            req.params.id,
            { $set: { isVerified } },
            { new: true }
        ).populate("owner");

        if (!store) return next({ status: 404, message: "Store not found" });

        return res.status(200).json({
            success: true,
            message: isVerified ? "Store verified" : "Store verification revoked",
            data: store,
        });
    } catch (err) {
        return next(err);
    }
};

exports.deleteStore = async (req, res, next) => {
    try {
        const user = await UserModel.findById(req.user._id);
        if (!user) return next({ status: 404, message: "NOT found" });

        const deleteSeller = await Store.findByIdAndDelete(req.params.id);
        if (!deleteSeller) return res.status(404).json({ message: "Seller not found" });

        //!delete Products
        //!delete Products from shoping Card

        return res.status(200).json({ message: "Seller deleted successfully" });
    } catch (err) {
        return next(err);
    }
};
