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
} from '../controllers/userController.js';
import { authRequired, requireRoles } from '../middleware/auth.js';

const router = Router();

// Public
router.post('/register', registerUser);
router.post('/login', loginUser);

// Authenticated
router.get('/me', authRequired, getMe);
router.patch('/me', authRequired, updateMe);

// Admin
router.get('/', authRequired, requireRoles('admin'), listUsers);
router.get('/:id', authRequired, requireRoles('admin'), getUserById);
router.patch('/:id/status', authRequired, requireRoles('admin'), setUserStatus);

export default router;
