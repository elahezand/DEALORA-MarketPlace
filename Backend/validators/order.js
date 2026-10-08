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
    status: z.enum(["created", "processing", "shipped", "completed", "cancelled"]).optional(),
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
// expected arrival: not in the past (5 min slack for clock drift), at most 60 days ahead
const DAY_MS = 24 * 60 * 60 * 1000;
const deliveryDate = z.coerce
    .date({ message: "Invalid delivery date" })
    .refine((d) => d.getTime() >= Date.now() - 5 * 60 * 1000, "Delivery time can't be in the past")
    .refine((d) => d.getTime() <= Date.now() + 60 * DAY_MS, "Delivery time must be within 60 days");

const shipOrderSchema = z.object({
    trackingCode: z.string().trim().max(100).optional(),
    estimatedDeliveryAt: deliveryDate.optional(),
});

const cashNotReceivedSchema = z.object({
    note: z.string().trim().max(500).optional(),
});

const deliveryEstimateSchema = z.object({
    estimatedDeliveryAt: deliveryDate,
});

module.exports = {
    checkoutSchema,
    updateOrderAdminSchema,
    updateOrderOwnerSchema,
    cancelOrderSchema,
    shipOrderSchema,
    deliveryEstimateSchema,
    cashNotReceivedSchema,
};