// routes/courseRoutes.js
import { Router } from 'express';
import { authRequired, requireRoles } from '../middleware/auth.js';
import {
  createCourse, listCourses, getCourse, updateCourse, deleteCourse
} from '../controllers/courseController.js';

const router = Router();

router.get('/', listCourses);
router.get('/:id', getCourse);

router.post('/', authRequired, requireRoles('admin'), createCourse);
router.patch('/:id', authRequired, requireRoles('admin'), updateCourse);
router.delete('/:id', authRequired, requireRoles('admin'), deleteCourse);

export default router;
