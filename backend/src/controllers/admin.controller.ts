import { Response } from "express";
import prisma from "../utils/prismaClient";
import { AuthedRequest } from "../middleware/auth";
import { adminReviewSchema } from "../utils/validation";

export async function listAllApplications(req: AuthedRequest, res: Response) {
  const { status } = req.query as { status?: string };
  const apps = await prisma.loanApplication.findMany({
    where: status ? { status: status as any } : undefined,
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      eligibility: true,
      emiSelection: true,
    },
    orderBy: { updatedAt: "desc" },
  });
  return res.json(apps);
}

export async function getApplicationDetail(req: AuthedRequest, res: Response) {
  const app = await prisma.loanApplication.findUnique({
    where: { id: (req.params.id as string) },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      kyc: true,
      eligibility: true,
      emiSelection: true,
      bankAccount: true,
      declaration: true,
      selfie: true,
    },
  });
  if (!app) return res.status(404).json({ error: "Application not found" });
  return res.json(app);
}

/**
 * Admin decision on the selfie/final review step. This is the only place
 * an application moves from ADMIN_REVIEW to APPROVED/REJECTED — again
 * gated server-side on current status, not on the admin UI state.
 */
export async function reviewApplication(req: AuthedRequest, res: Response) {
  const app = await prisma.loanApplication.findUnique({ where: { id: (req.params.id as string) } });
  if (!app) return res.status(404).json({ error: "Application not found" });
  if (app.status !== "ADMIN_REVIEW") {
    return res.status(409).json({ error: `Cannot review application at status ${app.status}` });
  }

  const parsed = adminReviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { action, rejectionReason } = parsed.data;

  await prisma.selfieVerification.update({
    where: { applicationId: app.id },
    data: {
      status: action === "APPROVE" ? "APPROVED" : "REJECTED",
      rejectionReason: action === "REJECT" ? rejectionReason : null,
      reviewedBy: req.user!.userId,
      reviewedAt: new Date(),
    },
  });

  const updated = await prisma.loanApplication.update({
    where: { id: app.id },
    data: { status: action === "APPROVE" ? "APPROVED" : "REJECTED" },
  });

  return res.json(updated);
}

export async function markDisbursed(req: AuthedRequest, res: Response) {
  const app = await prisma.loanApplication.findUnique({ where: { id: (req.params.id as string) } });
  if (!app) return res.status(404).json({ error: "Application not found" });
  if (app.status !== "APPROVED") {
    return res.status(409).json({ error: "Only approved applications can be disbursed" });
  }

  const updated = await prisma.loanApplication.update({
    where: { id: app.id },
    data: { status: "DISBURSED" },
  });
  return res.json(updated);
}
