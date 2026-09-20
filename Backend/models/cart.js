const { Schema, Types } = require("mongoose");
const mongoose = require("mongoose");

const cartItemSchema = new Schema(
  {
    offer: { type: Types.ObjectId, ref: "OfferSeller", required: false, default: null },
    store: { type: Types.ObjectId, ref: "Store", default: null },
    product: { type: Types.ObjectId, ref: "Listing", required: true },
    variantId: { type: Types.ObjectId, default: null },
    variantSnapshot: {
      attributes: { type: Map, of: String, default: null },
      sku: { type: String, default: null },
    },
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


cartSchema.methods.recalcPricing = async function () {
  const subtotal = this.items.reduce(
    (sum, item) => sum + item.priceSnapshot * item.quantity,
    0
  );

  let discount = 0;
  if (this.coupon?.couponRef) {
    const couponDoc = await mongoose
      .model("Coupon")
      .findById(this.coupon.couponRef)
      .lean();

    const now = new Date();
    const isValid =
      !!couponDoc &&
      couponDoc.isActive &&
      (!couponDoc.startsAt || couponDoc.startsAt <= now) &&
      (!couponDoc.expiresAt || couponDoc.expiresAt >= now) &&
      (couponDoc.usageLimit == null || couponDoc.usedCount < couponDoc.usageLimit);

    if (isValid) {
      if (couponDoc.type === "percent") {
        discount = (subtotal * Number(couponDoc.amount || 0)) / 100;
      } else if (couponDoc.type === "fixed") {
        discount = Math.min(Number(couponDoc.amount || 0), subtotal);
      }
      if (couponDoc.maxDiscount) {
        discount = Math.min(discount, Number(couponDoc.maxDiscount));
      }
    } else {
      // No longer valid — drop it from the cart so the UI doesn't keep
      // showing a coupon that silently stopped applying.
      this.coupon = null;
    }
  }

  this.pricing.subtotal = Math.round(subtotal * 100) / 100;
  this.pricing.discount = Math.round(discount * 100) / 100;
  this.pricing.total = Math.round(
    Math.max(0, subtotal - discount + (this.pricing.shippingCost ?? 0)) * 100
  ) / 100;
};

cartSchema.pre("save", async function () {
  await this.recalcPricing();
});

const Cart = mongoose.models.Cart || mongoose.model("Cart", cartSchema);

module.exports = Cart;