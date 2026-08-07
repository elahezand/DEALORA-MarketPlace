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

    productId: {
      type: Types.ObjectId,
      ref: "Product",
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

commentSchema.index({ productId: 1, status: 1, parentId: 1 });
commentSchema.index({ user: 1, createdAt: -1 });
commentSchema.index({ parentId: 1, createdAt: 1 });


const Comment = mongoose.models.Comment || mongoose.model("Comment", commentSchema);
module.exports = Comment;