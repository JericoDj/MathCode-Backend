// controllers/requestSessionController.js
import SessionRequest from '../models/SessionRequest.js';

// Create a new session request
export const createRequestSession = async (req, res, next) => {
  try {
    const data = {
      ...req.body,
      requestedBy: req.user?._id, // from token
      status: 'pending',
    };
    const doc = await SessionRequest.create(data);
    res.status(201).json(doc);
  } catch (err) { next(err); }
};

// List all session requests (parents see their own, admin can see all)
export const listRequestSessions = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(200, parseInt(req.query.limit || '50', 10));
    const skip = (page - 1) * limit;
    const q = {};

    // Allow filtering
    if (req.query.childId) q.childId = req.query.childId;
    if (req.query.status) q.status = req.query.status;

    // Parents only see their own requests unless admin flag
    if (!req.user.roles?.includes('admin')) {
      q.requestedBy = req.user._id;
    }

    const [items, total] = await Promise.all([
      SessionRequest.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit),
      SessionRequest.countDocuments(q),
    ]);

    res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

// Get one session request
export const getRequestSession = async (req, res, next) => {
  try {
    const doc = await SessionRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Request not found' });

    // Ensure parent can only access their own
    if (!req.user.roles?.includes('admin') && doc.requestedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(doc);
  } catch (err) { next(err); }
};

// Update request (reschedule or edit)
export const updateRequestSession = async (req, res, next) => {
  try {
    const doc = await SessionRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Request not found' });

    if (!req.user.roles?.includes('admin') && doc.requestedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    Object.assign(doc, req.body);
    await doc.save();
    res.json(doc);
  } catch (err) { next(err); }
};

// Delete or cancel request
export const deleteRequestSession = async (req, res, next) => {
  try {
    const doc = await SessionRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Request not found' });

    if (!req.user.roles?.includes('admin') && doc.requestedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Either soft delete or actually delete
    await doc.deleteOne();
    res.json({ ok: true });
  } catch (err) { next(err); }
};
