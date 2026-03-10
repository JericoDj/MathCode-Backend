// routes/userRoutes.js
import { Router } from 'express';
import {
  registerUser,
  loginUser,
  getMe,
  updateMe,
  listUsers,
  getUserById,
  setUserStatus,
  changePassword,
  requestPasswordReset,
  resetPasswordWithOTP,
  updateUser,
  // Add the new Google OAuth controllers
  initGoogleAuth,
  googleAuth,
  completeGoogleSignup,
  googleAuthCallback,
  setPasswordAfterGoogle,

} from '../controllers/userController.js';
import { authRequired, requireRoles } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Public (rate-limited)
router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);

// Google OAuth routes (rate-limited)
router.post('/auth/google/init', authLimiter, initGoogleAuth);
router.post('/auth/google', authLimiter, googleAuth);
router.post('/auth/google/complete', authLimiter, completeGoogleSignup);
router.post('/auth/google/set-password', authLimiter, setPasswordAfterGoogle);
router.post('/auth/google/callback', authLimiter, googleAuthCallback);


// Authenticated
router.get('/me', authRequired, getMe);
router.patch('/me', authRequired, updateMe);

// Admin
router.get('/', authRequired, requireRoles('admin'), listUsers);
router.get('/:id', authRequired, requireRoles('admin'), getUserById);
router.patch('/:id', authRequired, requireRoles('admin'), updateUser);
router.patch('/:id/status', authRequired, requireRoles('admin'), setUserStatus);

// ChangePass
router.post('/change-password', authRequired, changePassword);

// Pass with otp (rate-limited)
router.post('/forgot-password', authLimiter, requestPasswordReset);
router.post('/reset-password', authLimiter, resetPasswordWithOTP);

export default router;