// controllers/courseController.js
import Course from '../models/Course.js';

export const createCourse = async (req, res, next) => {
  try { res.status(201).json(await Course.create(req.body)); }
  catch (err) { next(err); }
};

export const listCourses = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, parseInt(req.query.limit || '20', 10));
    const skip = (page - 1) * limit;

    const q = {};
    if (req.query.stream) q.stream = req.query.stream;
    if (req.query.active) q.active = req.query.active === 'true';
    if (req.query.level) q.level = req.query.level;

    const [items, total] = await Promise.all([
      Course.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Course.countDocuments(q),
    ]);
    res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

export const getCourse = async (req, res, next) => {
  try {
    const doc = await Course.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Course not found' });
    res.json(doc);
  } catch (err) { next(err); }
};

export const updateCourse = async (req, res, next) => {
  try {
    const doc = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ message: 'Course not found' });
    res.json(doc);
  } catch (err) { next(err); }
};

export const deleteCourse = async (req, res, next) => {
  try {
    const doc = await Course.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Course not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
};
