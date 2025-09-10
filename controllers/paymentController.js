// controllers/paymentController.js
import mongoose from 'mongoose';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';

export const createPayment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { invoiceId, amountPhp } = req.body;

    const invoice = await Invoice.findById(invoiceId).session(session);
    if (!invoice) {
      await session.abortTransaction(); session.endSession();
      return res.status(404).json({ message: 'Invoice not found' });
    }
    if (invoice.status === 'void') {
      await session.abortTransaction(); session.endSession();
      return res.status(400).json({ message: 'Cannot pay a void invoice' });
    }

    const payment = await Payment.create([{ ...req.body }], { session });
    const p = payment[0];

    // Update invoice
    invoice.paymentIds.push(p._id);
    const newBalance = Math.max(0, (invoice.balancePhp ?? invoice.totalPhp) - amountPhp);
    invoice.balancePhp = Math.round(newBalance * 100) / 100;
    if (invoice.balancePhp === 0) {
      invoice.status = 'paid';
      invoice.paidAt = invoice.paidAt || new Date();
    } else if (invoice.status === 'draft') {
      invoice.status = 'sent';
      invoice.issuedAt = invoice.issuedAt || new Date();
    }
    await invoice.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json(p);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

export const listPayments = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, parseInt(req.query.limit || '20', 10));
    const skip = (page - 1) * limit;
    const q = {};
    if (req.query.invoiceId) q.invoiceId = req.query.invoiceId;
    if (req.query.method) q.method = req.query.method;
    if (req.query.status) q.status = req.query.status;

    const [items, total] = await Promise.all([
      Payment.find(q).sort({ paidAt: -1 }).skip(skip).limit(limit),
      Payment.countDocuments(q),
    ]);
    res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

export const getPayment = async (req, res, next) => {
  try {
    const doc = await Payment.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Payment not found' });
    res.json(doc);
  } catch (err) { next(err); }
};

export const refundPayment = async (req, res, next) => {
  // Simple refund flow: mark payment refunded and increase invoice balance
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const payment = await Payment.findById(req.params.id).session(session);
    if (!payment) {
      await session.abortTransaction(); session.endSession();
      return res.status(404).json({ message: 'Payment not found' });
    }
    if (payment.status === 'refunded') {
      await session.abortTransaction(); session.endSession();
      return res.status(400).json({ message: 'Already refunded' });
    }

    const invoice = await Invoice.findById(payment.invoiceId).session(session);
    if (!invoice) {
      await session.abortTransaction(); session.endSession();
      return res.status(404).json({ message: 'Invoice not found' });
    }

    payment.status = 'refunded';
    await payment.save({ session });

    invoice.balancePhp = Math.round((invoice.balancePhp + payment.amountPhp) * 100) / 100;
    if (invoice.balancePhp > 0 && invoice.status === 'paid') {
      invoice.status = 'sent'; // back to open
    }
    await invoice.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({ ok: true });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};
