import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, apiErrorMessage } from "../../api/client";
import type { LoanApplication } from "../../types";
import { Card, Button, ErrorText, FieldLabel, inputClass } from "../../components/ui";
import { StatusPill } from "../../components/StatusPill";

function formatINR(n?: number) {
  if (n === undefined) return "—";
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-ink-100 py-2 text-sm last:border-0">
      <span className="shrink-0 text-ink-400">{label}</span>
      <span className="text-right font-medium text-ink-900">{value}</span>
    </div>
  );
}

export default function AdminApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<LoanApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const refresh = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await api.get(`/admin/applications/${id}`);
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

  async function handleReview(action: "APPROVE" | "REJECT") {
    setActionLoading(true);
    setError(null);
    try {
      await api.post(`/admin/applications/${id}/review`, {
        action,
        rejectionReason: action === "REJECT" ? rejectionReason : undefined,
      });
      await refresh();
      setShowRejectForm(false);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDisburse() {
    setActionLoading(true);
    setError(null);
    try {
      await api.post(`/admin/applications/${id}/disburse`);
      await refresh();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <div className="mx-auto max-w-2xl px-4 py-16 text-ink-400 sm:px-6">Loading…</div>;
  if (!app) return <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6"><ErrorText>{error || "Not found"}</ErrorText></div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <button onClick={() => navigate("/admin")} className="mb-4 text-sm text-ink-400 underline">
        ← Back to applications
      </button>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-lg font-semibold text-ink-900 sm:text-xl">{app.user?.name}</h1>
        <StatusPill status={app.status} />
      </div>
      <p className="text-sm text-ink-400">{app.user?.email} · {app.user?.phone}</p>

      {app.kyc && (
        <Card className="mt-6">
          <h3 className="font-display font-semibold text-ink-900">KYC</h3>
          <div className="mt-2">
            <Row label="Full name" value={app.kyc.fullName} />
            <Row label="DOB" value={new Date(app.kyc.dob).toLocaleDateString()} />
            <Row label="Gender" value={app.kyc.gender} />
            <Row label="Address" value={app.kyc.address} />
            <Row label="ID" value={`${app.kyc.idType} · ${app.kyc.idNumber}`} />
          </div>
        </Card>
      )}

      {app.eligibility && (
        <Card className="mt-4">
          <h3 className="font-display font-semibold text-ink-900">Eligibility</h3>
          <div className="mt-2">
            <Row label="Monthly income" value={formatINR(app.eligibility.monthlyIncome)} />
            <Row label="Requested amount" value={formatINR(app.eligibility.requestedAmount)} />
            <Row label="Employer" value={app.eligibility.employer} />
            <Row label="Credit score (simulated)" value={app.eligibility.creditScore} />
            <Row label="DTI ratio" value={`${app.eligibility.dtiRatio}%`} />
            <Row label="Result" value={app.eligibility.result} />
          </div>
        </Card>
      )}

      {app.emiSelection && (
        <Card className="mt-4">
          <h3 className="font-display font-semibold text-ink-900">EMI plan</h3>
          <div className="mt-2">
            <Row label="Amount" value={formatINR(app.emiSelection.amount)} />
            <Row label="Tenure" value={`${app.emiSelection.tenureMonths} months`} />
            <Row label="Nominal rate" value={`${app.emiSelection.interestRate}%`} />
            <Row label="Monthly EMI" value={formatINR(app.emiSelection.emi)} />
            <Row label="Net disbursement" value={formatINR(app.emiSelection.netDisbursement)} />
            <Row label="Effective annual rate (IRR)" value={`${app.emiSelection.irrAnnual}%`} />
          </div>
        </Card>
      )}

      {app.bankAccount && (
        <Card className="mt-4">
          <h3 className="font-display font-semibold text-ink-900">Bank account</h3>
          <div className="mt-2">
            <Row label="Holder" value={app.bankAccount.holderName} />
            <Row label="Bank" value={app.bankAccount.bankName} />
            <Row label="Account" value={app.bankAccount.accountNumber} />
            <Row label="IFSC" value={app.bankAccount.ifsc} />
            <Row label="Verified" value={app.bankAccount.verified ? "Yes" : "No"} />
          </div>
        </Card>
      )}

      {app.selfie && (
        <Card className="mt-4">
          <h3 className="font-display font-semibold text-ink-900">Selfie verification</h3>
          <div className="mt-3 flex items-center gap-4">
            <img
              src={`${(import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace("/api", "")}${app.selfie.photoUrl}`}
              alt="Applicant selfie"
              className="h-24 w-24 rounded-xl object-cover"
            />
            <div className="text-sm">
              <p className="text-ink-400">
                Status: <span className="font-medium text-ink-900">{app.selfie.status}</span>
              </p>
              {app.selfie.rejectionReason && (
                <p className="mt-1 text-rose-500">Reason: {app.selfie.rejectionReason}</p>
              )}
            </div>
          </div>
        </Card>
      )}

      <ErrorText>{error}</ErrorText>

      {app.status === "ADMIN_REVIEW" && (
        <Card className="mt-4">
          <h3 className="font-display font-semibold text-ink-900">Decision</h3>
          {!showRejectForm ? (
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => handleReview("APPROVE")} disabled={actionLoading}>
                Approve
              </Button>
              <Button variant="danger" onClick={() => setShowRejectForm(true)} disabled={actionLoading}>
                Reject
              </Button>
            </div>
          ) : (
            <div className="mt-3">
              <FieldLabel>Rejection reason</FieldLabel>
              <input
                className={inputClass}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Selfie doesn't match ID photo"
              />
              <div className="mt-3 flex gap-3">
                <Button
                  variant="danger"
                  onClick={() => handleReview("REJECT")}
                  disabled={actionLoading || !rejectionReason}
                >
                  Confirm rejection
                </Button>
                <Button variant="secondary" onClick={() => setShowRejectForm(false)} disabled={actionLoading}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {app.status === "APPROVED" && (
        <Card className="mt-4">
          <Button onClick={handleDisburse} disabled={actionLoading} className="w-full">
            {actionLoading ? "Processing…" : "Mark as disbursed"}
          </Button>
        </Card>
      )}
    </div>
  );
}