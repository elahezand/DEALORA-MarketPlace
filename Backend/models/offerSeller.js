const mongoose = require("mongoose");
const notifyUser = require("../utils/notify");
const { calcFinalPrice, syncListingMinPrice } = require("../utils/pricing");

const offerSellerSchema = new mongoose.Schema(
  {
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
      index: true,
    },

    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "variantId is required"],
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    discount: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    finalPrice: {
      type: Number,
      min: 0,
      index: true,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
    },

    shipsWithinDays: {
      type: Number,
      min: 0,
      max: 60,
      default: 3,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected","deleted"],
      default: "pending",
      index: true,
    },

    adminComment: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// finalPrice = price - price * discount / 100
offerSellerSchema.pre("validate", function () {
  this.finalPrice = calcFinalPrice(this.price, this.discount);
});

const syncMinPrice = (productId) => syncListingMinPrice(productId);
offerSellerSchema.post("save", async function () {
  await syncMinPrice(this.productId);
});
offerSellerSchema.post("findOneAndUpdate", async function () {
  const doc = await this.model.findOne(this.getQuery());
  if (doc) await syncMinPrice(doc.productId);
});
offerSellerSchema.post("updateOne", async function () {
  const doc = await this.model.findOne(this.getQuery());
  if (doc) await syncMinPrice(doc.productId);
});
offerSellerSchema.post("findOneAndDelete", async function (doc) {
  if (doc) await syncMinPrice(doc.productId);
});

async function getStoreOwnerId(storeId) {
  if (!storeId) return null;
  const store = await mongoose.model("Store").findById(storeId).select("owner").lean();
  return store?.owner || null;
}

offerSellerSchema.pre("save", function () {
  this._statusChanged = this.isModified("status");
});
offerSellerSchema.post("save", async function (doc) {
  if (!doc._statusChanged) return;
  if (!["accepted", "rejected"].includes(doc.status)) return;

  const msg =
    doc.status === "accepted"
      ? "Your offer was accepted!"
      : "Your offer was rejected.";
  const ownerId = await getStoreOwnerId(doc.store);
  if (!ownerId) return;
  await notifyUser(ownerId, msg, {
    type: doc.status === "accepted" ? "offer_accepted" : "offer_rejected",
    link: "/dashboard/seller/offers",
  });
});
offerSellerSchema.pre("findOneAndUpdate", async function () {
  const doc = await this.model.findOne(this.getQuery()).select("status").lean();
  this._prevStatus = doc?.status;
});
offerSellerSchema.post("findOneAndUpdate", async function (doc) {
  if (!doc) return;
  const update = this.getUpdate() || {};
  const newStatus = update.status ?? update.$set?.status;
  if (!newStatus || newStatus === this._prevStatus) return;
  if (!["accepted", "rejected"].includes(newStatus)) return;

  const msg =
    newStatus === "accepted"
      ? "Your offer was accepted!"
      : "Your offer was rejected.";
  const ownerId = await getStoreOwnerId(doc.store);
  if (!ownerId) return;
  await notifyUser(ownerId, msg, {
    type: newStatus === "accepted" ? "offer_accepted" : "offer_rejected",
    link: "/dashboard/seller/offers",
  });
});
offerSellerSchema.pre("updateOne", async function () {
  const doc = await this.model.findOne(this.getQuery()).select("status").lean();
  this._prevStatus = doc?.status;
});
offerSellerSchema.post("updateOne", async function () {
  const doc = await this.model.findOne(this.getQuery());
  if (!doc) return;
  const update = this.getUpdate() || {};
  const newStatus = update.status ?? update.$set?.status;
  if (!newStatus || newStatus === this._prevStatus) return;
  if (!["accepted", "rejected"].includes(newStatus)) return;

  const msg =
    newStatus === "accepted"
      ? "Your offer was accepted!"
      : "Your offer was rejected.";
  const ownerId = await getStoreOwnerId(doc.store);
  if (!ownerId) return;
  await notifyUser(ownerId, msg, {
    type: newStatus === "accepted" ? "offer_accepted" : "offer_rejected",
    link: "/dashboard/seller/offers",
  });
});

offerSellerSchema.index({ store: 1, status: 1 });
offerSellerSchema.index({ productId: 1, status: 1, stock: 1 });
offerSellerSchema.index({ productId: 1, variantId: 1, status: 1 });

const Offer =
  mongoose.models.OfferSeller || mongoose.model("OfferSeller", offerSellerSchema);

module.exports = Offer;