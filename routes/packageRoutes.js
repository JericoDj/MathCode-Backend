// routes/packageRoutes.js
import { Router } from 'express';
import { authRequired, requireRoles } from '../middleware/auth.js';
import {
  createPackage,
  listPackages,
  getPackage,
  updatePackage,
  deletePackage
} from '../controllers/packageController.js';

const router = Router();

router.get('/', authRequired, listPackages);
router.get('/:id', authRequired, getPackage);

router.post('/', authRequired, requireRoles('admin', 'instructor', 'parent'), createPackage);
router.patch('/:id', authRequired, requireRoles('admin', 'instructor', 'parent'), updatePackage);
router.delete('/:id', authRequired, requireRoles('admin', 'instructor', 'parent'), deletePackage);

export default router;