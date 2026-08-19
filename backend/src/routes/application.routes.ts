import { Router } from "express";
import * as appController from "../controllers/application.controller";
import { requireAuth } from "../middleware/auth";
import { uploadIdPhoto, uploadSelfie, attachFileUrl } from "../middleware/upload";

const router = Router();

router.use(requireAuth);

router.post("/", appController.createApplication);
router.get("/", appController.listMyApplications);
router.get("/:id", appController.getApplication);

router.post(
  "/:id/kyc",
  uploadIdPhoto.single("idPhoto"),
  attachFileUrl("idPhotoUrl", "/uploads/id-photos"),
  appController.submitKyc
);
router.post("/:id/eligibility", appController.submitEligibility);

router.post("/emi/preview", appController.previewEmi); // no application id needed, pure calc
router.post("/:id/emi", appController.submitEmiSelection);

router.post("/:id/bank", appController.submitBankAccount);
router.post("/:id/declaration", appController.submitDeclaration);
router.post(
  "/:id/selfie",
  uploadSelfie.single("selfie"),
  attachFileUrl("photoUrl", "/uploads/selfies"),
  appController.submitSelfie
);

export default router;
