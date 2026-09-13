const mongoose = require("mongoose");
const notifyUser = require("../utils/notify");

const offerSellerSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },

    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
      index: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },

    discount: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
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
      enum: ["pending", "accepted", "rejected"],
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
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
  }
);

offerSellerSchema.virtual("finalPrice").get(function () {
  const price = Number(this.price || 0);
  const discount = Number(this.discount || 0);
  return Math.round((price - (price * discount) / 100) * 100) / 100;
});

//SyncPrice
async function syncMinPrice(listingId) {
  const offers = await mongoose.model("OfferSeller").find({
    listing: listingId,
    status: "accepted",
    stock: { $gt: 0 },
  });
  if (!offers.length) {
    return;
  }

  const minFinalPrice = Math.min(...offers.map((o) => o.finalPrice));
  await mongoose.model("Listing").findByIdAndUpdate(listingId, { price: minFinalPrice });
}
offerSellerSchema.post("save", async function () {
  await syncMinPrice(this.listing);
});
offerSellerSchema.post("findOneAndUpdate", async function () {
  const doc = await this.model.findOne(this.getQuery());
  if (doc) await syncMinPrice(doc.listing);
});
offerSellerSchema.post("updateOne", async function () {
  const doc = await this.model.findOne(this.getQuery());
  if (doc) await syncMinPrice(doc.listing);
});
offerSellerSchema.post("findOneAndDelete", async function (doc) {
  if (doc) await syncMinPrice(doc.listing);
});

// Notify the seller when an admin actually accepts/rejects their offer.
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
  await notifyUser(doc.seller, msg, {
    type: doc.status === "accepted" ? "offer_accepted" : "offer_rejected",
    link: "/dashboard/offers",
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
  await notifyUser(doc.seller, msg, {
    type: newStatus === "accepted" ? "offer_accepted" : "offer_rejected",
    link: "/dashboard/offers",
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
  await notifyUser(doc.seller, msg, {
    type: newStatus === "accepted" ? "offer_accepted" : "offer_rejected",
    link: "/dashboard/offers",
  });
});

offerSellerSchema.index({ listing: 1, status: 1 });
offerSellerSchema.index({ seller: 1, status: 1 });
offerSellerSchema.index({ listing: 1, status: 1, stock: 1 });

const Offer =
  mongoose.models.OfferSeller || mongoose.model("OfferSeller", offerSellerSchema);

module.exports = Offer;