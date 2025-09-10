// controllers/classGroupController.js
import ClassGroup from '../models/ClassGroup.js';

export const createClassGroup = async (req, res, next) => {
  try { res.status(201).json(await ClassGroup.create(req.body)); }
  catch (err) { next(err); }
};

export const listClassGroups = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, parseInt(req.query.limit || '20', 10));
    const skip = (page - 1) * limit;

    const q = {};
    if (req.query.courseId) q.courseId = req.query.courseId;
    if (req.query.status) q.status = req.query.status;

    const [items, total] = await Promise.all([
      ClassGroup.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit),
      ClassGroup.countDocuments(q),
    ]);
    res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

export const getClassGroup = async (req, res, next) => {
  try {
    const doc = await ClassGroup.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'ClassGroup not found' });
    res.json(doc);
  } catch (err) { next(err); }
};

export const updateClassGroup = async (req, res, next) => {
  try {
    const doc = await ClassGroup.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ message: 'ClassGroup not found' });
    res.json(doc);
  } catch (err) { next(err); }
};

export const deleteClassGroup = async (req, res, next) => {
  try {
    const doc = await ClassGroup.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'ClassGroup not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
};
