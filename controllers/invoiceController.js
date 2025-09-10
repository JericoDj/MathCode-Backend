// controllers/invoiceController.js
import Invoice from '../models/Invoice.js';

export const createInvoice = async (req, res, next) => {
  try {
    const body = req.body || {};
    // default number if you want to accept client-generated numbers
    if (!body.number) {
      const ts = Date.now().toString().slice(-6);
      body.number = `INV-${new Date().getFullYear()}-${ts}`;
    }
    const doc = await Invoice.create(body);
    res.status(201).json(doc);
  } catch (err) { next(err); }
};

export const listInvoices = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, parseInt(req.query.limit || '20', 10));
    const skip = (page - 1) * limit;
    const q = {};
    if (req.query.userId) q.userId = req.query.userId;
    if (req.query.status) q.status = req.query.status;
    if (req.query.search) q.number = new RegExp(req.query.search, 'i');

    const [items, total] = await Promise.all([
      Invoice.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Invoice.countDocuments(q),
    ]);
    res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

export const getInvoice = async (req, res, next) => {
  try {
    const doc = await Invoice.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Invoice not found' });
    res.json(doc);
  } catch (err) { next(err); }
};

export const updateInvoice = async (req, res, next) => {
  try {
    const doc = await Invoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ message: 'Invoice not found' });
    // ensure totals correct after manual updates
    doc.recalcTotals();
    await doc.save();
    res.json(doc);
  } catch (err) { next(err); }
};

export const setInvoiceStatus = async (req, res, next) => {
  try {
    const { status } = req.body; // 'draft'|'sent'|'paid'|'void'
    const doc = await Invoice.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Invoice not found' });

    doc.status = status;
    if (status === 'sent' && !doc.issuedAt) doc.issuedAt = new Date();
    if (status === 'paid') {
      doc.balancePhp = 0;
      if (!doc.paidAt) doc.paidAt = new Date();
    }
    await doc.save();
    res.json(doc);
  } catch (err) { next(err); }
};

export const deleteInvoice = async (req, res, next) => {
  try {
    const doc = await Invoice.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Invoice not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
};
