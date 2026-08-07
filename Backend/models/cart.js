const { Schema, Types } = require("mongoose");
const mongoose = require("mongoose");

const cartItemSchema = new Schema(
  {
    offer: { type: Types.ObjectId, ref: "OfferSeller", required: false, default: null },
    product: { type: Types.ObjectId, ref: "Listing", required: true },
    variantId: { type: Types.ObjectId, required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    priceSnapshot: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const couponSchema = new Schema(
  {
    couponRef: { type: Types.ObjectId, ref: "Coupon", default: null },
    code: { type: String, uppercase: true, trim: true },
    discountType: { type: String, enum: ["fixed", "percent"] },
    discountValue: { type: Number, min: 0 },
    maxDiscount: { type: Number, min: 0 },
  },
  { _id: false }
);

const pricingSchema = new Schema(
  {
    subtotal: { type: Number, min: 0, default: 0 },
    discount: { type: Number, min: 0, default: 0 },
    shippingCost: { type: Number, min: 0, default: 0 },
    total: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

const cartSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true },
    items: { type: [cartItemSchema], default: [] },
    coupon: { type: couponSchema, default: null },
    pricing: { type: pricingSchema, default: () => ({}) },
    status: {
      type: String,
      enum: ["active", "abandoned", "converted"],
      default: "active",
    },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
cartSchema.index({ user: 1, status: 1 });


cartSchema.methods.recalcPricing = function () {
  const subtotal = this.items.reduce(
    (sum, item) => sum + item.priceSnapshot * item.quantity,
    0
  );

  let discount = 0;
  if (this.coupon?.discountType) {
    if (this.coupon.discountType === "percent") {
      discount = (subtotal * (this.coupon.discountValue ?? 0)) / 100;
      if (this.coupon.maxDiscount) {
        discount = Math.min(discount, this.coupon.maxDiscount);
      }
    } else if (this.coupon.discountType === "fixed") {
      discount = Math.min(this.coupon.discountValue ?? 0, subtotal);
    }
  }

  this.pricing.subtotal = Math.round(subtotal * 100) / 100;
  this.pricing.discount = Math.round(discount * 100) / 100;
  this.pricing.total = Math.round(
    Math.max(0, subtotal - discount + (this.pricing.shippingCost ?? 0)) * 100
  ) / 100;
};

cartSchema.pre("save", async function () {
  this.recalcPricing();
});

const Cart = mongoose.models.Cart || mongoose.model("Cart", cartSchema);

module.exports = Cart;