// routes/packageRoutes.js
import { Router } from 'express';
import { authRequired, requireRoles } from '../middleware/auth.js';
import { upload,} from '../middleware/ upload.middleware.js';
import {
  createPackage,
  listPackages,
  getPackage,
  updatePackage,
  deletePackage,
  listMyPackages,
  submitPaymentProof,

} from '../controllers/packageController.js';

const router = Router();
router.post('/mine', authRequired, listMyPackages);


router.get('/', authRequired, listPackages);
router.get('/:id', authRequired, getPackage);



router.post('/', authRequired, requireRoles('admin', 'instructor', 'parent'), createPackage);
router.patch('/:id', authRequired, requireRoles('admin', 'instructor', 'parent'), updatePackage);
router.delete('/:id', authRequired, requireRoles('admin', 'instructor', 'parent'), deletePackage);



router.patch(
  "/:id/payment",
  upload.single("paymentProof"),
  submitPaymentProof
);

export default router;