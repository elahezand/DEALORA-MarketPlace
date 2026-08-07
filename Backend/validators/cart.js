const { z } = require("zod");
const mongoose = require("mongoose");

/* ObjectId Validator */
const objectIdSchema = z.string().refine(
  (val) => mongoose.Types.ObjectId.isValid(val),
  { message: "Invalid ObjectId" }
);

const cartItemZodSchema = z.object({
  offer: objectIdSchema.nullable().optional(),
  product: objectIdSchema,
  variantId: objectIdSchema,
  quantity: z.number().int().min(1),
  priceSnapshot: z.number().nonnegative(),
});

/* Coupon Schema -  */
const couponZodSchema = z.object({
  couponRef: objectIdSchema.nullable().optional(),
  code: z.string().trim().toUpperCase().optional(),
  discountType: z.enum(["fixed", "percent"]),
  discountValue: z.number().nonnegative(),
  maxDiscount: z.number().nonnegative().optional(),
});

/* Pricing Schema */
const pricingZodSchema = z.object({
  subtotal: z.number().nonnegative(),
  discount: z.number().nonnegative(),
  shippingCost: z.number().nonnegative(),
  total: z.number().nonnegative(),
});

/* Cart Base Schema */
const cartBaseZodSchema = z.object({
  user: objectIdSchema.optional(),
  items: z.array(cartItemZodSchema).default([]),
  coupon: couponZodSchema.nullable().optional(),
  pricing: pricingZodSchema.optional(),
  status: z.enum(["active", "abandoned", "converted"]).default("active"),
  expiresAt: z.coerce.date().nullable().optional(),
});

const createCartSchema = cartBaseZodSchema;
const updateCartSchema = cartBaseZodSchema.partial();


const addToCartSchema = z.object({
  items: z.array(cartItemZodSchema).min(1, "At least one item is required"),
});

module.exports = {
  createCartSchema,
  updateCartSchema,
  addToCartSchema,
  cartItemZodSchema,
  couponZodSchema,
  pricingZodSchema,
};