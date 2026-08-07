const { z } = require("zod");

const shippingSchema = z.object({
    fullName: z.string().min(2),
    phone: z.string().min(6),
    address: z.string().min(5),
    city: z.string().min(2),
    postalCode: z.string().optional(),
    country: z.string().optional(),
});

const checkoutSchema = z.object({
    shipping: shippingSchema,

    paymentMethod: z.enum(["cash", "card", "paypal"]),
});

const updateOrderSchema = z.object({
    paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]).optional(),

    status: z.enum(["created", "processing", "shipped", "completed", "cancelled"]).optional(),

    isDelivered: z.boolean().optional(),

    deliveredAt: z.string().datetime().optional(),
});

const cancelOrderSchema = z.object({
    reason: z.string().min(3).max(200).optional(),
});

module.exports = {
    checkoutSchema,
    updateOrderSchema,
    cancelOrderSchema,
};