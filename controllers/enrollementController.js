// controllers/enrollmentController.js
import Enrollment from '../models/Enrollment.js';

export const createEnrollment = async (req, res, next) => {
  try { res.status(201).json(await Enrollment.create(req.body)); }
  catch (err) { next(err); }
};

export const listEnrollments = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(200, parseInt(req.query.limit || '50', 10));
    const skip = (page - 1) * limit;

    const q = {};
    if (req.query.classGroupId) q.classGroupId = req.query.classGroupId;
    if (req.query.studentId) q.studentId = req.query.studentId;
    if (req.query.status) q.status = req.query.status;

    const [items, total] = await Promise.all([
      Enrollment.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Enrollment.countDocuments(q),
    ]);
    res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

export const getEnrollment = async (req, res, next) => {
  try {
    const doc = await Enrollment.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Enrollment not found' });
    res.json(doc);
  } catch (err) { next(err); }
};

export const updateEnrollment = async (req, res, next) => {
  try {
    const doc = await Enrollment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ message: 'Enrollment not found' });
    res.json(doc);
  } catch (err) { next(err); }
};

export const deleteEnrollment = async (req, res, next) => {
  try {
    const doc = await Enrollment.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Enrollment not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
};
