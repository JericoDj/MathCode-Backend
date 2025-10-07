import { Router } from 'express';
import { authRequired, requireRoles } from '../middleware/auth.js';
import {
  createRequestSession,
  listRequestSessions,
  getRequestSession,
  updateRequestSession,
  deleteRequestSession
} from '../controllers/requestSessionController.js';

const router = Router();

// Guests or parents can create a session request
router.post('/', authRequired, createRequestSession);

// Get all session requests (parents see only their own, admins can see all)
router.get('/', authRequired, listRequestSessions);

// Get a specific session request by ID
router.get('/:id', authRequired, getRequestSession);

// Update a request (reschedule or edit notes)
router.patch('/:id', authRequired, updateRequestSession);

// Cancel or delete a request
router.delete('/:id', authRequired, deleteRequestSession);

/* ----- Additional admin routes ----- */

// Admin: get all requests for a specific child
router.get('/child/:childId', authRequired, requireRoles('admin'), async (req, res, next) => {
  try {
    const requests = await listRequestSessions({
      query: { childId: req.params.childId },
      userRoles: ['admin'],
      userId: req.userId
    });
    res.json(requests);
  } catch (err) { next(err); }
});

// Admin: get all requests by status
router.get('/status/:status', authRequired, requireRoles('admin'), async (req, res, next) => {
  try {
    const requests = await listRequestSessions({
      query: { status: req.params.status },
      userRoles: ['admin'],
      userId: req.userId
    });
    res.json(requests);
  } catch (err) { next(err); }
});

export default router;
