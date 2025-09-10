// controllers/attendanceController.js
import Attendance from '../models/Attendance.js';

export const markAttendance = async (req, res, next) => {
  try {
    const { sessionId, studentId } = req.body;
    const doc = await Attendance.findOneAndUpdate(
      { sessionId, studentId },
      req.body,
      { upsert: true, new: true, runValidators: true }
    );
    res.status(201).json(doc);
  } catch (err) { next(err); }
};

export const listAttendance = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(200, parseInt(req.query.limit || '50', 10));
    const skip = (page - 1) * limit;

    const q = {};
    if (req.query.sessionId) q.sessionId = req.query.sessionId;
    if (req.query.studentId) q.studentId = req.query.studentId;
    if (req.query.status) q.status = req.query.status;

    const [items, total] = await Promise.all([
      Attendance.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Attendance.countDocuments(q),
    ]);
    res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

export const getAttendance = async (req, res, next) => {
  try {
    const doc = await Attendance.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Attendance not found' });
    res.json(doc);
  } catch (err) { next(err); }
};

export const deleteAttendance = async (req, res, next) => {
  try {
    const doc = await Attendance.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Attendance not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
};
