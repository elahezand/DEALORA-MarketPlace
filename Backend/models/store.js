const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    province: { type: String, trim: true, default: null },
    city: { type: String, trim: true, default: null },
    street: { type: String, trim: true, default: null },
    postalCode: { type: String, trim: true, default: null },
    coordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
  },
  { _id: false }
);

const storeSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, lowercase: true, trim: true, index: true },
    logo: { type: String, default: null },
    address: { type: addressSchema, default: () => ({}) },
    phone: { type: String, default: null, },
    isVerified: { type: Boolean, default: false },
    meta: {
      ratings: { type: Number, default: 0 },
      reviewsCount: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

storeSchema.index({ "address.city": 1 });

storeSchema.virtual("offers", {
  ref: "Offer",
  localField: "_id",
  foreignField: "sellers.store",
});

storeSchema.pre("save", function () {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");
  }
});
const Store = mongoose.model("Store", storeSchema);

module.exports = Store;