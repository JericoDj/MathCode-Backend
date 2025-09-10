// routes/paymentRoutes.js
import { Router } from 'express';
import { authRequired, requireRoles } from '../middleware/auth.js';
import {
  createPayment, listPayments, getPayment, refundPayment
} from '../controllers/paymentController.js';

const router = Router();

router.get('/', authRequired, requireRoles('admin'), listPayments);
router.get('/:id', authRequired, requireRoles('admin'), getPayment);

router.post('/', authRequired, requireRoles('admin'), createPayment);
router.post('/:id/refund', authRequired, requireRoles('admin'), refundPayment);

export default router;
