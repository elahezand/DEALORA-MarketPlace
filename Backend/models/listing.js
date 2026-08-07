const mongoose = require("mongoose");
const { Schema } = mongoose;
const { nanoid } = require("nanoid");

const LocationSchema = new Schema(
  {
    state: { type: String, trim: true, required: true },
    city: { type: String, trim: true, required: true },
  },
  { _id: false }
);

const VariantSchema = new Schema(
  {
    attributes: { 
      type: Map, 
      of: String, 
      required: [true, "Variant attributes are required"] 
    },
    sku: { type: String, required: true, trim: true },
    price: { type: Number, min: 0 }, 
    stock: { type: Number, default: 0, min: 0 }
  },
  { _id: true }
);

/* MAIN UNIFIED SCHEMA */
const UnifiedListingSchema = new Schema(
  {
    listingType: {
      type: String,
      enum: ["user_ad", "store_product"],
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    description: { type: String, required: true, trim: true, maxlength: 3000 },
    images: { 
      type: [String], 
      default: [],
      validate: [v => Array.isArray(v) && v.length <= 10, "Maximum 10 images allowed"]
    },
    categoryPath: {
      type: [Schema.Types.ObjectId],
      ref: "Category",
      default: [],
    },
    price: { type: Number, required: true, min: 0 },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: function () { return this.listingType === "user_ad"; },
    },
    store: { 
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: function () { return this.listingType === "store_product"; },
    },
    location: {
      type: LocationSchema,
      required: function () { return this.listingType === "user_ad"; },
    },
    condition: {
      type: String,
      enum: ["new", "used"],
      default: "new",
    },
    shipping: {
      type: {
        type: String,
        enum: ["standard", "express", "free"],
        default: "standard",
      },
      cost: { type: Number, default: 0, min: 0 },
    },
    variants: {
      type: [VariantSchema],
      required: function () { return this.listingType === "store_product"; },
      validate: {
        validator: function (v) {
          if (this.listingType === "store_product") return v && v.length > 0;
          return true;
        },
        message: "Store products must have at least one variant."
      }
    },
    shortIdentifier: { type: String, unique: true, sparse: true },
    tags: { type: [String], default: [] },
    specs: { type: Map, of: String, default: {} },
    metrics: {
      views: { type: Number, default: 0, min: 0 },
      sold: { type: Number, default: 0, min: 0 },
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "deleted", "active", "inactive", "draft"],
      default: function () {
        return this.listingType === "user_ad" ? "pending" : "draft";
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* === VIRTUALS === */
UnifiedListingSchema.virtual("offers", {
  ref: "OfferSeller",
  localField: "_id",
  foreignField: "product",
});

/* === MIDDLEWARES / HOOKS === */
UnifiedListingSchema.pre("save", async function () {
  if (!this.shortIdentifier) {
    this.shortIdentifier = nanoid(8);
  }

  if (this.isModified("title") && this.title) {
    const cleanTitle = this.title
      .toLowerCase()
      .trim()
      .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, "") 
      .replace(/\s+/g, "-"); 
    this.slug = `${cleanTitle}-${this.shortIdentifier}`; 
  }
});

/* === SENIOR INDEXING STRATEGY === */
UnifiedListingSchema.index({ listingType: 1, status: 1, categoryPath: 1, price: 1 });
UnifiedListingSchema.index({ status: 1, "location.city": 1, "location.neighborhood": 1 });
UnifiedListingSchema.index({ user: 1, status: 1 });
UnifiedListingSchema.index({ store: 1, status: 1 }); // Index baraye store_product query-ha
UnifiedListingSchema.index({ "variants.sku": 1 }, { sparse: true });
UnifiedListingSchema.index({ tags: 1 });

// Full-Text Index ba vazn-dehi baraye search-e herfeyitar
UnifiedListingSchema.index(
  { title: "text", description: "text" },
  { weights: { title: 10, description: 2 }, name: "ListingTextIndex" }
);

module.exports = mongoose.models.Listing || mongoose.model("Listing", UnifiedListingSchema);