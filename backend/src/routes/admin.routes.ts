import { Router } from "express";
import * as adminController from "../controllers/admin.controller";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/applications", adminController.listAllApplications);
router.get("/applications/:id", adminController.getApplicationDetail);
router.post("/applications/:id/review", adminController.reviewApplication);
router.post("/applications/:id/disburse", adminController.markDisbursed);

export default router;
