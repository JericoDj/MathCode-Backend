// routes/requestSessionRoutes.js
import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import {
  createRequestSession,
  listRequestSessions,
  getRequestSession,
  updateRequestSession,
  deleteRequestSession
} from '../controllers/requestSessionController.js';

const router = Router();

// Guests/Parents can request a session for their child
router.post('/', authRequired, createRequestSession);

// Get all session requests (can be filtered by userId, childId, status)
router.get('/', authRequired, listRequestSessions);

// Get a specific session request by ID
router.get('/:id', authRequired, getRequestSession);

// Allow parent to update (e.g., reschedule or edit notes)
router.patch('/:id', authRequired, updateRequestSession);

// Allow parent to cancel (soft delete or remove)
router.delete('/:id', authRequired, deleteRequestSession);

export default router;
