const { z } = require("zod");
const mongoose = require("mongoose");

const objectId = (field = "ID") =>
    z.string().trim().refine(val => mongoose.Types.ObjectId.isValid(val), {
        message: `Invalid ${field} ID`,
    });

const createOfferSchema = z.object({
    productId: objectId("product"),
    variantId: objectId("variantId"),
    price: z.number().nonnegative(),
    stock: z.number().int().min(1),
    discount: z.number().min(0).max(100).optional(),
    shipsWithinDays: z.number().int().min(0).max(60).optional(),
    description: z.string().trim().max(500).optional(),
});

// Sent by the SELLER when editing their own pending/accepted offer.
const updateOfferSchema = z
    .object({
        price: z.number().nonnegative().optional(),
        stock: z.number().int().min(1).optional(),
        discount: z.number().min(0).max(100).optional(),
        shipsWithinDays: z.number().int().min(0).max(60).optional(),
        description: z.string().trim().max(500).optional(),
    })
    .refine(
        (data) => data.price !== undefined || data.stock !== undefined || data.discount !== undefined || data.shipsWithinDays !== undefined || data.description !== undefined,
        { message: "At least one of price, stock, discount, shipsWithinDays or description must be provided" }
    );

// Sent by the ADMIN when accepting/rejecting a seller's offer.
const approveOfferSchema = z.object({
    status: z.enum(["accepted", "rejected"]),
    adminComment: z
        .string()
        .optional()
        .nullable()
        .transform((s) => (typeof s === "string" ? s.trim() : s)),
});


module.exports = {
    createOfferSchema,
    updateOfferSchema,
    approveOfferSchema,
};