// middleware/auth.js
import jwt from 'jsonwebtoken';

export const authRequired = (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Missing token' });

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_me');
    req.userId = payload.sub;
    req.userRoles = payload.roles || [];
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const requireRoles = (...roles) => (req, res, next) => {
  const hasRole = (req.userRoles || []).some((r) => roles.includes(r));
  if (!hasRole) return res.status(403).json({ message: 'Forbidden' });
  next();
};
