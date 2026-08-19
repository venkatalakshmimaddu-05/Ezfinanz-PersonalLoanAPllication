import type { ApplicationStatus } from "../types";

const LABELS: Record<ApplicationStatus, string> = {
  DRAFT: "Draft",
  KYC_PENDING: "KYC pending",
  ELIGIBILITY_PENDING: "Eligibility check pending",
  EMI_PENDING: "EMI selection pending",
  BANK_PENDING: "Bank details pending",
  DECLARATION_PENDING: "Declaration pending",
  SELFIE_PENDING: "Selfie verification pending",
  ADMIN_REVIEW: "Under review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  DISBURSED: "Disbursed",
};

const STYLES: Record<ApplicationStatus, string> = {
  DRAFT: "bg-ink-100 text-ink-600",
  KYC_PENDING: "bg-ink-100 text-ink-600",
  ELIGIBILITY_PENDING: "bg-ink-100 text-ink-600",
  EMI_PENDING: "bg-ink-100 text-ink-600",
  BANK_PENDING: "bg-ink-100 text-ink-600",
  DECLARATION_PENDING: "bg-ink-100 text-ink-600",
  SELFIE_PENDING: "bg-ink-100 text-ink-600",
  ADMIN_REVIEW: "bg-amber-100 text-amber-500",
  APPROVED: "bg-signal-100 text-signal-600",
  REJECTED: "bg-rose-100 text-rose-500",
  DISBURSED: "bg-signal-100 text-signal-600",
};

export function StatusPill({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${STYLES[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {LABELS[status]}
    </span>
  );
}
