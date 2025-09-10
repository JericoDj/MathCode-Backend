// controllers/sessionController.js
import Session from '../models/Session.js';

export const createSession = async (req, res, next) => {
  try { res.status(201).json(await Session.create(req.body)); }
  catch (err) { next(err); }
};

export const listSessions = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(200, parseInt(req.query.limit || '50', 10));
    const skip = (page - 1) * limit;
    const q = {};

    if (req.query.classGroupId) q.classGroupId = req.query.classGroupId;
    if (req.query.instructorId) q.instructorId = req.query.instructorId;
    if (req.query.status) q.status = req.query.status;

    // Optional date range filter
    if (req.query.from || req.query.to) {
      q.startAt = {};
      if (req.query.from) q.startAt.$gte = new Date(req.query.from);
      if (req.query.to) q.startAt.$lte = new Date(req.query.to);
    }

    const [items, total] = await Promise.all([
      Session.find(q).sort({ startAt: 1 }).skip(skip).limit(limit),
      Session.countDocuments(q),
    ]);
    res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

export const getSession = async (req, res, next) => {
  try {
    const doc = await Session.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Session not found' });
    res.json(doc);
  } catch (err) { next(err); }
};

export const updateSession = async (req, res, next) => {
  try {
    const doc = await Session.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ message: 'Session not found' });
    res.json(doc);
  } catch (err) { next(err); }
};

export const deleteSession = async (req, res, next) => {
  try {
    const doc = await Session.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Session not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
};
