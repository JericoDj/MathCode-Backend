// routes/studentRoutes.js
import { Router } from 'express';
import {
  createStudent,
  updateStudent,
  deleteStudent,
  getUsersByRole,
  getLinkedStudents,
  linkStudentToParent,
  unlinkStudentFromParent
} from '../controllers/studentController.js';
import { authRequired, requireRoles } from '../middleware/auth.js';

const router = Router();

// Create a student account (admin or instructor only)
router.post('/', authRequired, requireRoles('admin', 'instructor'), createStudent);

// Update student details
router.patch('/:id', authRequired, requireRoles('admin', 'instructor'), updateStudent);

// Delete student
router.delete('/:id', authRequired, requireRoles('admin'), deleteStudent);

// Get users by role (for example /api/students/role/student)
router.get('/role/:role', authRequired, requireRoles('admin', 'instructor'), getUsersByRole);

// Get linked students of a parent
router.get('/parent/:parentId', authRequired, getLinkedStudents);

// Link a student to a parent
router.post('/parent/:parentId/link/:studentId', authRequired, requireRoles('admin', 'instructor'), linkStudentToParent);

//unlink student from parent
router.delete('/parent/:parentId/unlink/:studentId', authRequired, requireRoles('admin', 'instructor'), unlinkStudentFromParent);
export default router;
