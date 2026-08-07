const mongoose = require("mongoose");
const { nanoid } = require("nanoid");

const VariantSchema = new mongoose.Schema(
  {
    attributes: { type: Map, of: String, required: true },
    sku: { type: String, required: true },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: true },
    slug: { type: String, unique: true, sparse: true },
    description: { type: String, trim: true, required: true },
    images: { type: [String], default: [] },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    minPrice: { type: Number, default: 0, index: true },

    variants: { type: [VariantSchema], required: true },
    specs: { type: Map, of: String, default: {} },
    tags: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["active", "inactive", "draft"],
      default: "draft",
      index: true,
    },
    shortIdentifier: { type: String, unique: true, sparse: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.virtual("offers", {
  ref: "OfferSeller",
  localField: "_id",
  foreignField: "product",
});

productSchema.pre("save", function (next) {
  if (!this.shortIdentifier) {
    this.shortIdentifier = nanoid(8);
  }
  next();
});

productSchema.index({ status: 1, minPrice: 1 });  
productSchema.index({ category: 1, status: 1 });  
productSchema.index({ tags: 1 });                 

const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);

module.exports = Product;