const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const commentSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    listing: {
      type: Types.ObjectId,
      ref: "Listing",
      required: true,
      index: true,
    },

    parentId: {
      type: Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
      index: true,
    },

    body: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 2000,
    },

    pros: {
      type: [String],
      default: [],
      set: (arr) =>
        Array.isArray(arr)
          ? [...new Set(arr.map((v) => String(v).trim()).filter(Boolean))]
          : [],
    },

    cons: {
      type: [String],
      default: [],
      set: (arr) =>
        Array.isArray(arr)
          ? [...new Set(arr.map((v) => String(v).trim()).filter(Boolean))]
          : [],
    },

    recommendation: {
      type: String,
      enum: ["recommended", "not_recommended", "no_idea"],
      default: "no_idea",
      index: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "spam", "deleted"],
      default: "pending",
      index: true,
    },

    moderation: {
      moderatedBy: {
        type: Types.ObjectId,
        ref: "User",
        default: null,
      },
      moderatedAt: {
        type: Date,
        default: null,
      },
      rejectReason: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
      },
    },

    verifiedPurchase: {
      type: Boolean,
      default: false,
      index: true,
    },

    editedAt: {
      type: Date,
      default: null,
    },

    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,

    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ret.id = String(ret._id);
        delete ret._id;
        return ret;
      },
    },
  }
);

commentSchema.index({ listing: 1, status: 1, parentId: 1 });
commentSchema.index({ user: 1, createdAt: -1 });
commentSchema.index({ parentId: 1, createdAt: 1 });

async function syncListingScore(listingId) {
  if (!listingId) return;

  const [agg] = await Comment.aggregate([
    {
      $match: {
        listing: new mongoose.Types.ObjectId(listingId),
        status: "approved",
        parentId: null,
        rating: { $ne: null },
      },
    },
    { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  const score = agg ? Math.round(agg.avgRating * 10) / 10 : 0;
  const reviewsCount = agg ? agg.count : 0;

  const Listing = mongoose.model("Listing");
  const listing = await Listing.findByIdAndUpdate(
    listingId,
    {
      "metrics.score": score,
      "metrics.reviewsCount": reviewsCount
    },
    { new: true }
  )
    .select("store listingType")
    .lean();

  if (listing?.listingType === "store_product" && listing.store) {
    await syncStoreScore(listing.store);
  }
}
async function syncStoreScore(storeId) {
  if (!storeId) return;

  const Listing = mongoose.model("Listing");
  const Store = mongoose.model("Store");

  const listingIds = await Listing.find({
    store: storeId,
    listingType: "store_product",
  }).distinct("_id");

  if (!listingIds.length) {
    await Store.findByIdAndUpdate(storeId, {
      "meta.ratings": 0,
    });
    return;
  }

  const [agg] = await Listing.aggregate([{
    $match: {
      _id: { $in: listingIds },
      "metrics.reviewsCount": { $gt: 0 },
    },
  },
  { $group: { _id: null, avgRating: { $avg: "$metrics.score" } } },
  ]);

  await Store.findByIdAndUpdate(storeId, {
    "meta.ratings": agg ? Math.round(agg.avgRating * 10) / 10 : 0,
  });
}

commentSchema.post("save", async function () {
  try {
    await syncListingScore(this.listing);
  } catch (error) {
    console.error("Error syncing listing score:", error);
  }
});
commentSchema.post("findOneAndUpdate", async function () {
  const doc = await this.model.findOne(this.getQuery());
  if (doc) await syncListingScore(doc.listing);
});
commentSchema.post("updateOne", async function () {
  const doc = await this.model.findOne(this.getQuery());
  if (doc) await syncListingScore(doc.listing);
});

const Comment = mongoose.models.Comment || mongoose.model("Comment", commentSchema);
module.exports = Comment;