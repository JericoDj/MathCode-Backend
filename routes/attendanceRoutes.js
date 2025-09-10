// routes/attendanceRoutes.js
import { Router } from 'express';
import { authRequired, requireRoles } from '../middleware/auth.js';
import {
  markAttendance, listAttendance, getAttendance, deleteAttendance
} from '../controllers/attendanceController.js';

const router = Router();

router.get('/', authRequired, listAttendance);
router.get('/:id', authRequired, getAttendance);

// Instructors/Admin can mark & delete
router.post('/', authRequired, requireRoles('admin', 'instructor'), markAttendance);
router.delete('/:id', authRequired, requireRoles('admin', 'instructor'), deleteAttendance);

export default router;
