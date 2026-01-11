import { Router } from "express";
import {
  getAllBillings,
  getBillingById,
  getBillingByUser,
  createBilling,
  updateBillingStatus,
  deleteBilling,
} from "../controllers/billingController.js";

import { authRequired, requireRoles } from "../middleware/auth.js";

const router = Router();

// Get all billings (admin access suggested)
router.get("/", authRequired, getAllBillings);

// Get billing by id
router.get("/:id", authRequired, getBillingById);

// Get billing by user
router.get("/user/:userId", authRequired, getBillingByUser);

// Create billing (admin/finance only recommended)
router.post("/", authRequired, createBilling);

// Update billing status
router.patch("/:id/status", authRequired, updateBillingStatus);

// Delete billing
router.delete("/:id", authRequired, deleteBilling);

export default router;
