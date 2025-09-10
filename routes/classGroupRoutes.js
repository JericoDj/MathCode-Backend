// routes/classGroupRoutes.js
import { Router } from 'express';
import { authRequired, requireRoles } from '../middleware/auth.js';
import {
  createClassGroup, listClassGroups, getClassGroup, updateClassGroup, deleteClassGroup
} from '../controllers/classGroupController.js';

const router = Router();

router.get('/', listClassGroups);
router.get('/:id', getClassGroup);

router.post('/', authRequired, requireRoles('admin', 'instructor'), createClassGroup);
router.patch('/:id', authRequired, requireRoles('admin', 'instructor'), updateClassGroup);
router.delete('/:id', authRequired, requireRoles('admin'), deleteClassGroup);

export default router;
