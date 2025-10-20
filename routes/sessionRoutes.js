import express from 'express';
import {
  getSessions,
  getSession,
  createSession,
  updateSession,
  deleteSession,
  updateSessionStatus,
  getSessionsByStudent,
  getSessionsByTutor,
  getTodaySessions
} from '../controllers/sessionController.js';
import { authRequired, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authRequired);

// @route   GET /api/sessions
// @desc    Get all sessions with filtering and pagination
// @access  Private/Admin
router.get('/', requireRoles('admin'), getSessions);

// @route   GET /api/sessions/today
// @desc    Get today's sessions
// @access  Private/Admin
router.get('/today', requireRoles('admin'), getTodaySessions);

// @route   GET /api/sessions/student/:studentId
// @desc    Get sessions by student
// @access  Private/Admin
router.get('/student/:studentId', requireRoles('admin'), getSessionsByStudent);

// @route   GET /api/sessions/tutor/:tutorName
// @desc    Get sessions by tutor
// @access  Private/Admin
router.get('/tutor/:tutorName', requireRoles('admin'), getSessionsByTutor);

// @route   GET /api/sessions/:id
// @desc    Get single session
// @access  Private/Admin
router.get('/:id', requireRoles('admin'), getSession);

// @route   POST /api/sessions
// @desc    Create new session
// @access  Private/Admin
router.post('/', requireRoles('admin'), createSession);

// @route   PUT /api/sessions/:id
// @desc    Update session
// @access  Private/Admin
router.put('/:id', requireRoles('admin'), updateSession);

// @route   PATCH /api/sessions/:id/status
// @desc    Update session status
// @access  Private/Admin
router.patch('/:id/status', requireRoles('admin'), updateSessionStatus);

// @route   DELETE /api/sessions/:id
// @desc    Delete session
// @access  Private/Admin
router.delete('/:id', requireRoles('admin'), deleteSession);

export default router;