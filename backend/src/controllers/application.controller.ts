import { Response } from "express";
import prisma from "../utils/prismaClient";
import { AuthedRequest } from "../middleware/auth";
import {
  kycSchema,
  eligibilitySchema,
  emiSelectionSchema,
  bankAccountSchema,
  declarationSchema,
  selfieSchema,
} from "../utils/validation";
import {
  calculateDTI,
  calculateEMI,
  calculateIRR,
  calculateNetDisbursement,
  evaluateEligibility,
} from "../services/loanCalc.service";
import { checkCreditScoreSimulated, verifyBankAccountSimulated } from "../services/simulated.service";
import { ApplicationStatus } from "@prisma/client";

/**
 * Central state-gate. Every step handler calls this before writing
 * anything. This is what stops a client from skipping steps by calling
 * endpoints out of order — the ONLY source of truth for "what step is
 * this application allowed to accept next" is server-side status,
 * never trust the frontend wizard's current screen.
 */
function assertStatus(current: ApplicationStatus, expected: ApplicationStatus) {
  if (current !== expected) {
    const err: any = new Error(
      `Application is at status ${current}, expected ${expected} for this step`
    );
    err.statusCode = 409;
    throw err;
  }
}

async function getOwnedApplication(applicationId: string, userId: string) {
  const app = await prisma.loanApplication.findUnique({ where: { id: applicationId } });
  if (!app || app.userId !== userId) {
    const err: any = new Error("Application not found");
    err.statusCode = 404;
    throw err;
  }
  return app;
}

// ---- Start / list applications ----

/**
 * Real enforcement of "both email and phone must be verified before later
 * steps" lives here, server-side — the frontend redirect to /verify is a
 * UX convenience only and would do nothing to stop someone from calling
 * this endpoint directly with a valid but unverified account's token.
 */
export async function createApplication(req: AuthedRequest, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) return res.status(404).json({ error: "User not found" });

  if (!user.emailVerified || !user.phoneVerified) {
    return res.status(403).json({
      error: "Please verify both your email and phone number before starting an application",
    });
  }

  const app = await prisma.loanApplication.create({
    data: { userId: req.user!.userId, status: "KYC_PENDING" },
  });
  return res.status(201).json(app);
}

export async function listMyApplications(req: AuthedRequest, res: Response) {
  const apps = await prisma.loanApplication.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: "desc" },
  });
  return res.json(apps);
}

export async function getApplication(req: AuthedRequest, res: Response) {
  const app = await prisma.loanApplication.findUnique({
    where: { id: (req.params.id as string) },
    include: {
      kyc: true,
      eligibility: true,
      emiSelection: true,
      bankAccount: true,
      declaration: true,
      selfie: true,
    },
  });
  if (!app || app.userId !== req.user!.userId) {
    return res.status(404).json({ error: "Application not found" });
  }
  return res.json(app);
}

// ---- Step 1: KYC ----

export async function submitKyc(req: AuthedRequest, res: Response) {
  try {
    const app = await getOwnedApplication((req.params.id as string), req.user!.userId);
    assertStatus(app.status, "KYC_PENDING");

    const parsed = kycSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const kyc = await prisma.kYCDetail.create({
      data: { applicationId: app.id, ...parsed.data, dob: new Date(parsed.data.dob) },
    });

    await prisma.loanApplication.update({
      where: { id: app.id },
      data: { status: "ELIGIBILITY_PENDING" },
    });

    return res.status(201).json(kyc);
  } catch (e: any) {
    return res.status(e.statusCode || 500).json({ error: e.message });
  }
}

// ---- Step 2: Eligibility ----

export async function submitEligibility(req: AuthedRequest, res: Response) {
  try {
    const app = await getOwnedApplication((req.params.id as string), req.user!.userId);
    assertStatus(app.status, "ELIGIBILITY_PENDING");

    const parsed = eligibilitySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { monthlyIncome, requestedAmount, employer, existingDebt } = parsed.data;

    const kyc = await prisma.kYCDetail.findUnique({ where: { applicationId: app.id } });
    if (!kyc) return res.status(409).json({ error: "Complete KYC first" });

    const creditScore = checkCreditScoreSimulated(kyc.idNumber);

    // Estimate new-loan EMI at a representative rate/tenure purely to
    // compute DTI at this stage; the customer picks their actual
    // tenure/rate in the next step.
    const provisional = calculateEMI(requestedAmount, 12, 36);
    const dtiRatio = calculateDTI({
      monthlyIncome,
      existingMonthlyDebt: existingDebt,
      newLoanEmi: provisional.emi,
    });

    const result = evaluateEligibility({
      monthlyIncome,
      requestedAmount,
      creditScore,
      dtiPercent: dtiRatio,
    });

    const eligibility = await prisma.eligibilityCheck.create({
      data: {
        applicationId: app.id,
        monthlyIncome,
        requestedAmount,
        employer,
        existingDebt,
        creditScore,
        dtiRatio,
        result,
      },
    });

    if (result === "NOT_ELIGIBLE") {
      await prisma.loanApplication.update({
        where: { id: app.id },
        data: { status: "REJECTED" },
      });
      return res.status(201).json({ ...eligibility, applicationStatus: "REJECTED" });
    }

    await prisma.loanApplication.update({
      where: { id: app.id },
      data: { status: "EMI_PENDING" },
    });

    return res.status(201).json({ ...eligibility, applicationStatus: "EMI_PENDING" });
  } catch (e: any) {
    return res.status(e.statusCode || 500).json({ error: e.message });
  }
}

// ---- Step 3: EMI selection (with live recompute support) ----

/** Non-persisting calculator so the frontend can show live numbers as the
 * customer drags tenure/amount sliders, before they commit the step. */
export async function previewEmi(req: AuthedRequest, res: Response) {
  const parsed = emiSelectionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { amount, tenureMonths, interestRate } = parsed.data;

  const PROCESSING_FEE_PCT = 2;
  const GST_PCT = 18;

  const { processingFee, gst, netDisbursement } = calculateNetDisbursement(
    amount,
    PROCESSING_FEE_PCT,
    GST_PCT
  );
  const { emi, totalInterest, totalRepayment } = calculateEMI(amount, interestRate, tenureMonths);
  const irrAnnual = calculateIRR(netDisbursement, emi, tenureMonths);

  return res.json({
    amount,
    tenureMonths,
    interestRate,
    processingFee,
    gst,
    netDisbursement,
    emi,
    totalInterest,
    totalRepayment,
    irrAnnual,
  });
}

export async function submitEmiSelection(req: AuthedRequest, res: Response) {
  try {
    const app = await getOwnedApplication((req.params.id as string), req.user!.userId);
    assertStatus(app.status, "EMI_PENDING");

    const parsed = emiSelectionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { amount, tenureMonths, interestRate } = parsed.data;

    const PROCESSING_FEE_PCT = 2;
    const GST_PCT = 18;
    const { processingFee, gst, netDisbursement } = calculateNetDisbursement(
      amount,
      PROCESSING_FEE_PCT,
      GST_PCT
    );
    const { emi, totalInterest, totalRepayment } = calculateEMI(amount, interestRate, tenureMonths);
    const irrAnnual = calculateIRR(netDisbursement, emi, tenureMonths);

    const emiSelection = await prisma.eMISelection.create({
      data: {
        applicationId: app.id,
        amount,
        tenureMonths,
        interestRate,
        processingFee,
        gst,
        netDisbursement,
        emi,
        totalInterest,
        totalRepayment,
        irrAnnual,
      },
    });

    await prisma.loanApplication.update({
      where: { id: app.id },
      data: { status: "BANK_PENDING" },
    });

    return res.status(201).json(emiSelection);
  } catch (e: any) {
    return res.status(e.statusCode || 500).json({ error: e.message });
  }
}

// ---- Step 4: Bank account ----

export async function submitBankAccount(req: AuthedRequest, res: Response) {
  try {
    const app = await getOwnedApplication((req.params.id as string), req.user!.userId);
    assertStatus(app.status, "BANK_PENDING");

    const parsed = bankAccountSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const verification = await verifyBankAccountSimulated(
      parsed.data.accountNumber,
      parsed.data.ifsc
    );
    if (!verification.verified) {
      return res.status(400).json({ error: `Bank verification failed: ${verification.reason}` });
    }

    const bankAccount = await prisma.bankAccount.create({
      data: { applicationId: app.id, ...parsed.data, verified: true },
    });

    await prisma.loanApplication.update({
      where: { id: app.id },
      data: { status: "DECLARATION_PENDING" },
    });

    return res.status(201).json(bankAccount);
  } catch (e: any) {
    return res.status(e.statusCode || 500).json({ error: e.message });
  }
}

// ---- Step 5: Declaration ----

export async function submitDeclaration(req: AuthedRequest, res: Response) {
  try {
    const app = await getOwnedApplication((req.params.id as string), req.user!.userId);
    assertStatus(app.status, "DECLARATION_PENDING");

    const parsed = declarationSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const declaration = await prisma.declaration.create({
      data: {
        applicationId: app.id,
        acceptedTerms: parsed.data.acceptedTerms,
        ipAddress: req.ip,
      },
    });

    await prisma.loanApplication.update({
      where: { id: app.id },
      data: { status: "SELFIE_PENDING" },
    });

    return res.status(201).json(declaration);
  } catch (e: any) {
    return res.status(e.statusCode || 500).json({ error: e.message });
  }
}

// ---- Step 6: Selfie upload -> submits for admin review ----

export async function submitSelfie(req: AuthedRequest, res: Response) {
  try {
    const app = await getOwnedApplication((req.params.id as string), req.user!.userId);
    assertStatus(app.status, "SELFIE_PENDING");

    const parsed = selfieSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const selfie = await prisma.selfieVerification.create({
      data: { applicationId: app.id, photoUrl: parsed.data.photoUrl, status: "PENDING" },
    });

    await prisma.loanApplication.update({
      where: { id: app.id },
      data: { status: "ADMIN_REVIEW" },
    });

    return res.status(201).json(selfie);
  } catch (e: any) {
    return res.status(e.statusCode || 500).json({ error: e.message });
  }
}
