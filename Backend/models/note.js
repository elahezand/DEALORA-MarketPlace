const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    msg: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 2000,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["active", "hidden", "deleted"],
      default: "active",
      index: true,
    },

    type: {
      type: String,
      enum: ["note", "warning", "info"],
      default: "note",
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toObject: { virtuals: true },
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// INDEXES (برای performance)
noteSchema.index({ product: 1, createdAt: -1 });
noteSchema.index({ user: 1 });

const Note =
  mongoose.models.Note || mongoose.model("Note", noteSchema);

module.exports = Note;