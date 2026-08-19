import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, apiErrorMessage } from "../../api/client";
import type { LoanApplication } from "../../types";
import { StepProgress } from "../../components/StepProgress";
import { Card, ErrorText } from "../../components/ui";
import { StatusPill } from "../../components/StatusPill";

import KycStep from "./steps/KycStep";
import EligibilityStep from "./steps/EligibilityStep";
import EmiStep from "./steps/EmiStep";
import BankStep from "./steps/BankStep";
import DeclarationStep from "./steps/DeclarationStep";
import SelfieStep from "./steps/SelfieStep";
import ReviewStatus from "./steps/ReviewStatus";
import RejectedStatus from "./steps/RejectedStatus";

export default function ApplicationWizard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<LoanApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await api.get(`/applications/${id}`);
      setApp(data);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (loading) return <div className="mx-auto max-w-2xl px-6 py-16 text-ink-400">Loading…</div>;
  if (error || !app)
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <ErrorText>{error || "Application not found"}</ErrorText>
      </div>
    );

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
      <button
        onClick={() => navigate("/dashboard")}
        className="mb-4 text-sm text-ink-400 underline"
      >
        ← Back to applications
      </button>

      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold text-ink-900">
          Application #{app.id.slice(0, 8)}
        </h1>
        <StatusPill status={app.status} />
      </div>

      <div className="mt-6">
        <StepProgress status={app.status} />
      </div>

      <Card className="mt-6">
        {app.status === "KYC_PENDING" && <KycStep applicationId={app.id} onDone={refresh} />}
        {app.status === "ELIGIBILITY_PENDING" && (
          <EligibilityStep applicationId={app.id} onDone={refresh} />
        )}
        {app.status === "EMI_PENDING" && (
          <EmiStep applicationId={app.id} requestedAmount={app.eligibility?.requestedAmount} onDone={refresh} />
        )}
        {app.status === "BANK_PENDING" && <BankStep applicationId={app.id} onDone={refresh} />}
        {app.status === "DECLARATION_PENDING" && (
          <DeclarationStep applicationId={app.id} onDone={refresh} />
        )}
        {app.status === "SELFIE_PENDING" && <SelfieStep applicationId={app.id} onDone={refresh} />}
        {app.status === "ADMIN_REVIEW" && <ReviewStatus />}
        {app.status === "REJECTED" && <RejectedStatus app={app} />}
        {app.status === "APPROVED" && (
          <div className="text-center py-6">
            <p className="text-lg font-semibold text-signal-600">Your loan is approved 🎉</p>
            <p className="mt-2 text-sm text-ink-600">
              Disbursement to your registered bank account is being processed.
            </p>
          </div>
        )}
        {app.status === "DISBURSED" && (
          <div className="text-center py-6">
            <p className="text-lg font-semibold text-signal-600">Funds disbursed</p>
            <p className="mt-2 text-sm text-ink-600">
              The loan amount has been transferred to your registered bank account.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
