const mongoose = require("mongoose");
const { Schema, Types } = mongoose;
const notifyUser = require("../utils/notify");

const orderItemSchema = new Schema(
  {
    product: {
      type: Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    variant: {
      type: Types.ObjectId,
      default: null,
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
    fulfillment: {
      status: {
        type: String,
        enum: ["pending", "shipped"],
        default: "pending",
      },
      trackingCode: { type: String, trim: true, default: null },
      shippedAt: { type: Date, default: null },
    },
    estimatedShipBy: { type: Date, default: null },
    needsAdminShipment: { type: Boolean, default: false },
  }
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

// Notify the buyer whenever their order's status actually changes.
orderSchema.pre("save", function () {
  this._statusChanged = this.isModified("status");
});
orderSchema.post("save", async function (doc) {
  if (!doc._statusChanged) return;

  const shortId = String(doc._id).slice(-6).toUpperCase();
  await notifyUser(
    doc.user,
    `Your order #${shortId} status changed to ${doc.status}`,
    { type: "order_status", link: `/dashboard/orders/${doc._id}` }
  );
});

orderSchema.pre("findOneAndUpdate", async function () {
  const doc = await this.model.findOne(this.getQuery()).select("status").lean();
  this._prevStatus = doc?.status;
});
orderSchema.post("findOneAndUpdate", async function (doc) {
  if (!doc) return;
  const update = this.getUpdate() || {};
  const newStatus = update.status ?? update.$set?.status;
  if (!newStatus || newStatus === this._prevStatus) return;

  const shortId = String(doc._id).slice(-6).toUpperCase();
  await notifyUser(
    doc.user,
    `Your order #${shortId} status changed to ${newStatus}`,
    { type: "order_status", link: `/dashboard/orders/${doc._id}` }
  );
});

orderSchema.pre("updateOne", async function () {
  const doc = await this.model.findOne(this.getQuery()).select("status").lean();
  this._prevStatus = doc?.status;
});
orderSchema.post("updateOne", async function () {
  const doc = await this.model.findOne(this.getQuery());
  if (!doc) return;
  const update = this.getUpdate() || {};
  const newStatus = update.status ?? update.$set?.status;
  if (!newStatus || newStatus === this._prevStatus) return;

  const shortId = String(doc._id).slice(-6).toUpperCase();
  await notifyUser(
    doc.user,
    `Your order #${shortId} status changed to ${newStatus}`,
    { type: "order_status", link: `/dashboard/orders/${doc._id}` }
  );
});

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
module.exports = Order;