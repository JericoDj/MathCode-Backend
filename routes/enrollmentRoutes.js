// routes/enrollmentRoutes.js
import { Router } from 'express';
import { authRequired, requireRoles } from '../middleware/auth.js';
import {
  createEnrollment, listEnrollments, getEnrollment, updateEnrollment, deleteEnrollment
} from '../controllers/enrollementController.js';

const router = Router();

// Students can read their own enrollments (filter by studentId = req.userId on client-side)
// Admin/Instructor can manage
router.get('/', authRequired, listEnrollments);
router.get('/:id', authRequired, getEnrollment);

router.post('/', authRequired, requireRoles('admin'), createEnrollment);
router.patch('/:id', authRequired, requireRoles('admin'), updateEnrollment);
router.delete('/:id', authRequired, requireRoles('admin'), deleteEnrollment);

export default router;
