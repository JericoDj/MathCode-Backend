// controllers/packageController.js
import Package from '../models/Package.js';

export const createPackage = async (req, res, next) => {
  try {
    const pkg = await Package.create(req.body);
    res.status(201).json(pkg);
  } catch (err) { next(err); }
};

export const listPackages = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, parseInt(req.query.limit || '20', 10));
    const skip = (page - 1) * limit;

    const q = {};
    if (req.query.stream) q.stream = req.query.stream;
    if (req.query.active) q.active = req.query.active === 'true';

    const [items, total] = await Promise.all([
      Package.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Package.countDocuments(q),
    ]);
    res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

export const getPackage = async (req, res, next) => {
  try {
    const doc = await Package.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Package not found' });
    res.json(doc);
  } catch (err) { next(err); }
};

export const updatePackage = async (req, res, next) => {
  try {
    const doc = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ message: 'Package not found' });
    res.json(doc);
  } catch (err) { next(err); }
};

export const deletePackage = async (req, res, next) => {
  try {
    const doc = await Package.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Package not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
};
