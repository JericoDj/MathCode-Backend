// routes/invoiceRoutes.js
import { Router } from 'express';
import { authRequired, requireRoles } from '../middleware/auth.js';
import {
  createInvoice, listInvoices, getInvoice, updateInvoice, setInvoiceStatus, deleteInvoice
} from '../controllers/invoiceController.js';

const router = Router();

// Admin-only create/delete; owners/admin can view.
// (Adjust auth rules as needed.)
router.get('/', authRequired, listInvoices);
router.get('/:id', authRequired, getInvoice);

router.post('/', authRequired, requireRoles('admin'), createInvoice);
router.patch('/:id', authRequired, requireRoles('admin'), updateInvoice);
router.patch('/:id/status', authRequired, requireRoles('admin'), setInvoiceStatus);
router.delete('/:id', authRequired, requireRoles('admin'), deleteInvoice);

export default router;
