// controllers/userController.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const signToken = (user) =>
  jwt.sign(
    { sub: user._id, roles: user.roles },
    process.env.JWT_SECRET || 'dev_secret_change_me',
    { expiresIn: '7d' }
  );

// Register
export const registerUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password, roles } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      roles: roles && roles.length ? roles : undefined,
      passwordHash: password, // hashed in pre-save hook
    });

    const token = signToken(user);
    res.status(201).json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        roles: user.roles,
        status: user.status,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
};

// Login
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user);
    res.json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        roles: user.roles,
        status: user.status,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
};

// Get my profile
export const getMe = async (req, res, next) => {
  try {
    const me = await User.findById(req.userId);
    if (!me) return res.status(404).json({ message: 'User not found' });
    res.json({
      id: me._id,
      firstName: me.firstName,
      lastName: me.lastName,
      email: me.email,
      phone: me.phone,
      roles: me.roles,
      status: me.status,
      profile: me.profile,
      guardians: me.guardians,
      guardianOf: me.guardianOf,
      createdAt: me.createdAt,
    });
  } catch (err) {
    next(err);
  }
};

// Update my profile (basic)
export const updateMe = async (req, res, next) => {
  try {
    const allowed = ['firstName', 'lastName', 'phone', 'profile'];
    const update = {};
    for (const k of allowed) if (k in req.body) update[k] = req.body[k];

    const me = await User.findByIdAndUpdate(req.userId, update, {
      new: true,
      runValidators: true,
    });
    res.json(me);
  } catch (err) {
    next(err);
  }
};

// Admin: list users (simple pagination)
export const listUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, parseInt(req.query.limit || '20', 10));
    const skip = (page - 1) * limit;
    const q = {};
    if (req.query.role) q.roles = req.query.role;
    if (req.query.status) q.status = req.query.status;

    const [items, total] = await Promise.all([
      User.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(q),
    ]);

    res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// Admin: get single user
export const getUserById = async (req, res, next) => {
  try {
    const doc = await User.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'User not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
};

// Admin: soft suspend / activate
export const setUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body; // 'active'|'invited'|'suspended'
    const doc = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ message: 'User not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
};
