// routes/packageRoutes.js
import { Router } from 'express';
import { authRequired, requireRoles } from '../middleware/auth.js';
import {
  createPackage, listPackages, getPackage, updatePackage, deletePackage
} from '../controllers/sessionController.js';

const router = Router();

// Public list (for storefront), Admin can manage
router.get('/', listPackages);
router.get('/:id', listPackages, getPackage); // get by id (fallback if middleware changes)
router.get('/:id', getPackage);

router.post('/', authRequired, requireRoles('admin'), createPackage);
router.patch('/:id', authRequired, requireRoles('admin'), updatePackage);
router.delete('/:id', authRequired, requireRoles('admin'), deletePackage);

export default router;
