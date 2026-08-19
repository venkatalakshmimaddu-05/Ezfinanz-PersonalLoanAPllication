import type { LoanApplication } from "../../../types";

export default function RejectedStatus({ app }: { app: LoanApplication }) {
  const reason = app.selfie?.rejectionReason;
  return (
    <div className="py-8 text-center">
      <p className="text-lg font-semibold text-rose-500">Application not approved</p>
      <p className="mt-2 text-sm text-ink-600">
        {reason
          ? reason
          : app.eligibility?.result === "NOT_ELIGIBLE"
          ? "Your debt-to-income ratio or credit score didn't meet our current eligibility threshold."
          : "This application did not pass our review."}
      </p>
      <p className="mt-3 text-sm text-ink-400">
        You're welcome to start a new application if your circumstances have changed.
      </p>
    </div>
  );
}
