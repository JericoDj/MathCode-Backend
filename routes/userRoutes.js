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
  googleAuth,
  completeGoogleSignup,
  googleAuthCallback,
  setPasswordAfterGoogle,

} from '../controllers/userController.js';
import { authRequired, requireRoles } from '../middleware/auth.js';

const router = Router();

// Public
router.post('/register', registerUser);
router.post('/login', loginUser);

// Google OAuth routes
router.post('/auth/google', googleAuth); // Token-based verification
router.post('/auth/google/complete', completeGoogleSignup);
router.post('/auth/google/set-password', setPasswordAfterGoogle);
router.post('/auth/google/callback', googleAuthCallback);


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

// Pass with otp
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPasswordWithOTP);

export default router;