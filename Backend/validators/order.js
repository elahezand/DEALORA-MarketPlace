const { z } = require("zod");

// Mirrors models/order.js -> shippingAddressSchema
const shippingAddressSchema = z.object({
    _id: z.string().optional(),
    name: z.string().min(2),
    phone: z.string().min(5).max(20).optional(),
    address: z.string().min(5),
    city: z.string().min(2),
    state: z.string().min(2),
    postalCode: z.string().min(3),
});

const checkoutSchema = z.object({
    shippingAddress: shippingAddressSchema,
    paymentMethod: z.enum(["cash", "zarinpal", "wallet"]),
    idempotencyKey: z.string().min(8).max(100).optional(),
    useWallet: z.boolean().optional(),
});

// ADMIN: full control over an order's lifecycle/payment state.
const updateOrderAdminSchema = z.object({
    paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
    status: z.enum(["created", "processing", "completed", "cancelled"]).optional(),
    isDelivered: z.boolean().optional(),
    deliveredAt: z.string().datetime().optional(),
});

const updateOrderOwnerSchema = z.object({
    shippingAddress: shippingAddressSchema.partial().optional(),
});

const cancelOrderSchema = z.object({
    reason: z.string().min(3).max(200).optional(),
});

// SELLER: mark (their part of) an order as shipped, with an optional
// tracking code.
const shipOrderSchema = z.object({
    trackingCode: z.string().trim().max(100).optional(),
});

module.exports = {
    checkoutSchema,
    updateOrderAdminSchema,
    updateOrderOwnerSchema,
    cancelOrderSchema,
    shipOrderSchema,
};