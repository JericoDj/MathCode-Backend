import mongoose from "mongoose";

const BillingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // new fields added
    userName: { type: String, required: true },
    childName: { type: String },
    package: { type: String, required: true },
    billingDate: { type: Date, default: Date.now },

    amount: { type: Number, required: true },
    currency: { type: String, default: "PHP" },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "cancelled"],
      default: "pending",
    },
    description: { type: String },
    dueDate: { type: Date },
    invoiceNumber: { type: String, unique: true },
  },
  { timestamps: true }
);

export default mongoose.model("Billing", BillingSchema);
