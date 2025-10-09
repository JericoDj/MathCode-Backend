import SessionRequest from '../models/SessionRequest.js';

// Create a new session request
export const createRequestSession = async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });

    const data = {
      ...req.body,
      requestedBy: req.userId,
      status: 'pending',   
    };

    const doc = await SessionRequest.create(data);
    res.status(201).json(doc);
  } catch (err) {
    // Send validation errors directly
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message, errors: err.errors });
    }
    res.status(500).json({  message: 'Server error', error: err.message });
  }
};

// List session requests
export const listRequestSessions = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(200, parseInt(req.query.limit || '50', 10));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.childId) query.childId = req.query.childId;
    if (req.query.status) query.status = req.query.status;

    // Non-admins see only their own requests
    if (!req.userRoles.includes('admin')) {
      query.requestedBy = req.userId;
    }

    const [items, total] = await Promise.all([
      SessionRequest.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      SessionRequest.countDocuments(query),
    ]);

    res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get one session request
export const getRequestSession = async (req, res) => {
  try {
    const doc = await SessionRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Request not found' });

    if (!req.userRoles.includes('admin') && doc.requestedBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update a session request
export const updateRequestSession = async (req, res) => {
  try {
    const doc = await SessionRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Request not found' });

    if (!req.userRoles.includes('admin') && doc.requestedBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    Object.assign(doc, req.body);
    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete or cancel session request
export const deleteRequestSession = async (req, res) => {
  try {
    const doc = await SessionRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Request not found' });

    if (!req.userRoles.includes('admin') && doc.requestedBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await doc.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
