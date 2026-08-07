const { z } = require("zod");
const mongoose = require("mongoose");

const objectId = (field = "ID") =>
    z.string().trim().refine(val => mongoose.Types.ObjectId.isValid(val), {
        message: `Invalid ${field} ID`,
    });

const createOfferSchema = z.object({
    seller: objectId,
    store: objectId,
    product: objectId,
    condition: z.enum(["new", "used"]).default("new"),
    price: z.number().nonnegative(),
    discount: z.number().min(0).max(100).default(0),
    stock: z.number().int().min(1),
});

const updateOfferSchema = z.object({
    status: z.enum(["pending", "accepted", "rejected"]),
    adminComment: z
        .string()
        .optional()
        .nullable()
        .transform((s) => (typeof s === "string" ? s.trim() : s)),
})


module.exports = {
    createOfferSchema,
    updateOfferSchema,
};