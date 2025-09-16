// models/Invoice.js
import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package' },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    qty: { type: Number, required: true, min: 1, default: 1 },
    unitPricePhp: { type: Number, required: true, min: 0 },
    discountPhp: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true, trim: true }, // e.g. INV-2025-000123
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // billed to (guardian or student)
    guardianId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment' },
    lineItems: { type: [lineItemSchema], default: [] },
    subtotalPhp: { type: Number, default: 0 },
    taxPhp: { type: Number, default: 0 },
    totalPhp: { type: Number, default: 0 },
    balancePhp: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 }, // e.g., 0.12 for 12%
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'void'],
      default: 'draft',
      index: true
    },
    dueDate: Date,
    issuedAt: Date,
    paidAt: Date,
    paymentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }],
    notes: String,
  },
  { timestamps: true }
);


invoiceSchema.index({ userId: 1, status: 1 });

// Helper to recompute totals
invoiceSchema.methods.recalcTotals = function () {
  const subtotal = (this.lineItems || []).reduce((sum, li) => {
    const line = (li.qty || 0) * (li.unitPricePhp || 0) - (li.discountPhp || 0);
    return sum + Math.max(0, line);
  }, 0);
  const tax = Math.max(0, subtotal * (this.taxRate || 0));
  const total = subtotal + tax;

  // Balance = total - sum(payments) (payments may be attached later)
  const paid = this.populated('paymentIds')
    ? (this.paymentIds || []).reduce((s, p) => s + (p?.amountPhp || 0), 0)
    : undefined; // if not populated, skip
  this.subtotalPhp = Math.round(subtotal * 100) / 100;
  this.taxPhp = Math.round(tax * 100) / 100;
  this.totalPhp = Math.round(total * 100) / 100;

  if (typeof paid === 'number') {
    this.balancePhp = Math.max(0, Math.round((total - paid) * 100) / 100);
  } else if (this.balancePhp == null) {
    // initialize balance if not set
    this.balancePhp = this.totalPhp;
  }
};

invoiceSchema.pre('save', function (next) {
  this.recalcTotals();
  next();
});

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
