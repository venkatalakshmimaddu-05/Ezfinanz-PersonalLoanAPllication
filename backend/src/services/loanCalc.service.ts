/**
 * Core financial math for the loan flow.
 * Every function here is pure (no I/O) so it can be unit tested in isolation.
 */

export interface EmiResult {
  emi: number;
  totalInterest: number;
  totalRepayment: number;
}

/**
 * Standard reducing-balance EMI formula:
 *   EMI = P * r * (1+r)^n / ((1+r)^n - 1)
 * where r is the *monthly* rate (annual% / 12 / 100).
 */
export function calculateEMI(
  principal: number,
  annualRatePercent: number,
  tenureMonths: number
): EmiResult {
  if (principal <= 0 || tenureMonths <= 0) {
    throw new Error("Principal and tenure must be positive");
  }
  const r = annualRatePercent / 12 / 100;

  let emi: number;
  if (r === 0) {
    // Edge case: 0% interest loans still need to divide evenly.
    emi = principal / tenureMonths;
  } else {
    const factor = Math.pow(1 + r, tenureMonths);
    emi = (principal * r * factor) / (factor - 1);
  }

  const totalRepayment = emi * tenureMonths;
  const totalInterest = totalRepayment - principal;

  return {
    emi: round2(emi),
    totalInterest: round2(totalInterest),
    totalRepayment: round2(totalRepayment),
  };
}

/**
 * Net amount that actually lands in the customer's account after
 * processing fee and GST on that fee are deducted up front.
 */
export function calculateNetDisbursement(
  principal: number,
  processingFeePercent: number,
  gstPercent: number
): { processingFee: number; gst: number; netDisbursement: number } {
  const processingFee = round2((principal * processingFeePercent) / 100);
  const gst = round2((processingFee * gstPercent) / 100);
  const netDisbursement = round2(principal - processingFee - gst);
  return { processingFee, gst, netDisbursement };
}

/**
 * Effective annual interest rate (IRR), accounting for the fact that the
 * customer only *receives* netDisbursement but repays EMIs calculated on
 * the full principal. This is what Excel's RATE() function solves for.
 *
 * We solve numerically for the monthly rate r such that:
 *   netDisbursement = sum_{t=1}^{n} EMI / (1+r)^t
 * using bisection (robust, no derivative needed, guaranteed to converge
 * for this monotonic NPV function within a sane bracket).
 */
export function calculateIRR(
  netDisbursement: number,
  emi: number,
  tenureMonths: number
): number {
  const npv = (monthlyRate: number): number => {
    let pv = 0;
    for (let t = 1; t <= tenureMonths; t++) {
      pv += emi / Math.pow(1 + monthlyRate, t);
    }
    return pv - netDisbursement;
  };

  // Bracket: monthly rate between 0% and 100%. NPV(0) is positive
  // (since emi*n > netDisbursement whenever fees > 0), NPV(high) is
  // negative, so bisection is guaranteed to converge.
  let low = 0;
  let high = 1; // 100% monthly, generous upper bound
  let mid = 0;

  for (let i = 0; i < 100; i++) {
    mid = (low + high) / 2;
    const val = npv(mid);
    if (Math.abs(val) < 1e-6) break;
    if (val > 0) {
      low = mid;
    } else {
      high = mid;
    }
  }

  const monthlyRate = mid;
  const annualRate = Math.pow(1 + monthlyRate, 12) - 1;
  return round2(annualRate * 100); // as a percentage
}

export interface DtiInput {
  monthlyIncome: number;
  existingMonthlyDebt: number;
  newLoanEmi: number;
}

export function calculateDTI(input: DtiInput): number {
  const { monthlyIncome, existingMonthlyDebt, newLoanEmi } = input;
  if (monthlyIncome <= 0) return 1; // treat as worst case, avoid div/0
  const dti = (existingMonthlyDebt + newLoanEmi) / monthlyIncome;
  return round2(dti * 100); // percentage
}

export type EligibilityResult = "ELIGIBLE" | "PARTIALLY_ELIGIBLE" | "NOT_ELIGIBLE";

export interface EligibilityInput {
  monthlyIncome: number;
  requestedAmount: number;
  creditScore: number;
  dtiPercent: number;
}

/**
 * Business rules:
 *  - DTI <= 40% and credit score >= 700         -> Eligible
 *  - DTI 40-50% or credit score 650-699         -> Partially Eligible
 *  - DTI > 50% or credit score < 650             -> Not Eligible
 *  - Requested amount > 20x monthly income       -> Not Eligible (sanity cap)
 */
export function evaluateEligibility(input: EligibilityInput): EligibilityResult {
  const { monthlyIncome, requestedAmount, creditScore, dtiPercent } = input;

  if (requestedAmount > monthlyIncome * 20) {
    return "NOT_ELIGIBLE";
  }
  if (dtiPercent > 50 || creditScore < 650) {
    return "NOT_ELIGIBLE";
  }
  if (dtiPercent <= 40 && creditScore >= 700) {
    return "ELIGIBLE";
  }
  return "PARTIALLY_ELIGIBLE";
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
