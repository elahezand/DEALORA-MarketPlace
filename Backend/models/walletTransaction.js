const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const walletTransactionSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true, index: true },
    order: { type: Types.ObjectId, ref: "Order", default: null },
    amount: { type: Number, required: true, min: 0 },
    type: { type: String, enum: ["spend", "refund"], required: true },
    note: { type: String, trim: true, default: "" },
    // partial refunds (one store's part cancelled) — their own key, so an order can have several
    orderRef: { type: Types.ObjectId, ref: "Order", default: null },
    key: { type: String, default: null },
  },
  { timestamps: true, versionKey: false }
);

walletTransactionSchema.index(
  { order: 1, type: 1 },
  { unique: true, partialFilterExpression: { order: { $type: "objectId" } } }
);

walletTransactionSchema.index(
  { key: 1 },
  { unique: true, partialFilterExpression: { key: { $type: "string" } } }
);

module.exports =
  mongoose.models.WalletTransaction || mongoose.model("WalletTransaction", walletTransactionSchema);
