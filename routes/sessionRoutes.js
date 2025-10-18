// routes/sessionRoutes.js
import { Router } from 'express';
import { authRequired, requireRoles } from '../middleware/auth.js';
import {
  createSession, listSessions, getSession, updateSession, deleteSession
} from '../controllers/sessionController.js';

const router = Router();

router.get('/', authRequired, listSessions);
router.get('/:id', authRequired, getSession);

router.post('/', authRequired, requireRoles('admin', 'instructor', "parent"), createSession);
router.patch('/:id', authRequired, requireRoles('admin', 'instructor'), updateSession);
router.delete('/:id', authRequired, requireRoles('admin', 'instructor', "parent"), deleteSession);

export default router;
