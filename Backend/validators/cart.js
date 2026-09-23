const { z } = require("zod");
const mongoose = require("mongoose");

/* ObjectId Validator */
const objectIdSchema = z.string().refine(
  (val) => mongoose.Types.ObjectId.isValid(val),
  { message: "Invalid ObjectId" }
);

/* One cart item: only WHAT to buy — prices are always calculated by the server */
const cartItemZodSchema = z.object({
  productId: objectIdSchema,
  variantId: objectIdSchema,
  offer: objectIdSchema.nullable().optional(),
  quantity: z.number().int().min(1),
});

/* PATCH /cart/me */
const updateCartSchema = z.object({
  items: z.array(cartItemZodSchema).optional(),
  couponCode: z.string().trim().min(1).optional(),
  shippingCost: z.number().nonnegative().optional(),
});

/* POST /cart/me/items */
const addToCartSchema = z.object({
  items: z.array(cartItemZodSchema).min(1, "At least one item is required"),
});

module.exports = {
  updateCartSchema,
  addToCartSchema,
  cartItemZodSchema,
};
