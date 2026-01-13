// routes/inquiryRoutes.js
import { Router } from 'express';
import { submitInquiry } from '../controllers/inquiryController.js';

const router = Router();
router.post('/', submitInquiry);

export default router;
