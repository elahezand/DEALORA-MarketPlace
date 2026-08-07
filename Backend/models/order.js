const mongoose = require("mongoose");
const { Schema, Types } = mongoose;
const citiesByState = require("../data/cities.json");

const orderItemSchema = new Schema(
  {
    product: {
      type: Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variant: {
      type: Types.ObjectId, 
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    seller: {
      type: Types.ObjectId,
      ref: "Store",
    },
    selectedColor: {
      type: String,
      trim: true,
    },
    selectedSize: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const couponSchema = new Schema(
  {
    code: { type: String, uppercase: true, trim: true },
    discountType: { type: String, enum: ["fixed", "percent"] },
    discountValue: { type: Number, min: 0 },
    maxDiscount: { type: Number, min: 0 },
  },
  { _id: false }
);

const pricingSchema = new Schema(
  {
    subtotal: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    shippingCost: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const shippingAddressSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    address: { type: String, required: true, trim: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true, index: true },
    items: {
      type: [orderItemSchema],
      validate: [(arr) => arr.length > 0, "Order items required"],
    },
    coupon: { type: couponSchema, default: null },
    pricing: { type: pricingSchema, required: true },
    shippingAddress: { type: shippingAddressSchema, required: true },
    paymentMethod: { type: String, enum: ["cash", "zarinpal"], required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    payment: {
      authority: { type: String, default: null },
      refId: { type: String, default: null },
      paidAt: { type: Date, default: null },
    },
    status: {
      type: String,
      enum: ["created", "processing", "shipped", "completed", "cancelled"],
      default: "created",
    },
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ "payment.authority": 1 });

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);


module.exports =Order ;