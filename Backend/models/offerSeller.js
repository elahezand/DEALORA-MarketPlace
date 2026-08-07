const mongoose = require("mongoose");

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

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    condition: {
      type: String,
      enum: ["new", "used"],
      default: "new",
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

async function syncMinPrice(productId) {
  const offers = await mongoose.model("OfferSeller").find({
    product: productId,
    status: "accepted",
    stock: { $gt: 0 },
  });

  if (!offers.length) {
    await mongoose.model("Product").findByIdAndUpdate(productId, { minPrice: 0 });
    return;
  }

  const minFinalPrice = Math.min(...offers.map((o) => o.finalPrice));
  await mongoose.model("Product").findByIdAndUpdate(productId, { minPrice: minFinalPrice });
}

offerSellerSchema.post("save", async function () {
  await syncMinPrice(this.product);
});
offerSellerSchema.post("findOneAndUpdate", async function () {
  const doc = await this.model.findOne(this.getQuery());
  if (doc) await syncMinPrice(doc.product);
});
offerSellerSchema.post("updateOne", async function () {
  const doc = await this.model.findOne(this.getQuery());
  if (doc) await syncMinPrice(doc.product);
});

offerSellerSchema.index({ product: 1, status: 1 });
offerSellerSchema.index({ seller: 1, status: 1 });
offerSellerSchema.index({ product: 1, status: 1, stock: 1 });

const Offer =
  mongoose.models.OfferSeller || mongoose.model("OfferSeller", offerSellerSchema);

module.exports = Offer;