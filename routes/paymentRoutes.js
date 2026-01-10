// routes/paymentRoutes.js
import { Router } from 'express';
import { authRequired, requireRoles } from '../middleware/auth.js';
import {
  createPayment, listPayments, getPayment, refundPayment
} from '../controllers/paymentController.js';

import {
  createPayPalOrder,
  capturePayPalOrder,
  setPayPalConfig,
  getPayPalConfig
} from '../controllers/paypalController.js';

const router = Router();

router.get('/', authRequired, requireRoles('admin'), listPayments);
router.get('/:id', authRequired, requireRoles('admin'), getPayment);

router.post('/', authRequired, requireRoles('admin'), createPayment);
router.post('/:id/refund', authRequired, requireRoles('admin'), refundPayment);


// Paypall

router.post('/paypal/create', authRequired, createPayPalOrder);
router.post('/paypal/capture', authRequired, capturePayPalOrder);
router.post('/paypal/config', authRequired, requireRoles('admin'), setPayPalConfig);
router.get('/paypal/config', authRequired, requireRoles('admin'), getPayPalConfig);

export default router;
