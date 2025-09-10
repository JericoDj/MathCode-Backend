// models/Payment.js
import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
    method: { type: String, enum: ['cash', 'gcash', 'bank', 'card'], required: true },
    amountPhp: { type: Number, required: true, min: 0.01 },
    paidAt: { type: Date, default: Date.now },
    reference: { type: String, trim: true }, // e.g., GCASH ref #
    status: { type: String, enum: ['posted', 'refunded', 'failed'], default: 'posted' },
    notes: String,
  },
  { timestamps: true }
);

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
