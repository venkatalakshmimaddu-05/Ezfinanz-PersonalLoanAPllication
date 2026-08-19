import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, apiErrorMessage } from "../../api/client";
import type { LoanApplication, ApplicationStatus } from "../../types";
import { Card, ErrorText } from "../../components/ui";
import { StatusPill } from "../../components/StatusPill";

const FILTERS: { label: string; value: ApplicationStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Under review", value: "ADMIN_REVIEW" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Disbursed", value: "DISBURSED" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [apps, setApps] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ApplicationStatus | "ALL">("ADMIN_REVIEW");

  useEffect(() => {
    setLoading(true);
    api
      .get("/admin/applications", { params: filter === "ALL" ? {} : { status: filter } })
      .then(({ data }) => setApps(data))
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="font-display text-xl font-semibold text-ink-900 sm:text-2xl">Applications</h1>
      <p className="mt-1 text-sm text-ink-400">Review and act on customer loan applications.</p>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium ${
              filter === f.value ? "bg-ink-900 text-white" : "bg-ink-100 text-ink-600"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ErrorText>{error}</ErrorText>

      {loading ? (
        <p className="mt-8 text-ink-400">Loading…</p>
      ) : apps.length === 0 ? (
        <Card className="mt-8 text-center text-ink-400">No applications in this view.</Card>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {apps.map((app) => (
            <Card key={app.id} onClick={() => navigate(`/admin/applications/${app.id}`)}>
              <div className="flex items-start justify-between gap-3 sm:items-center">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink-900">{app.user?.name}</p>
                  <p className="truncate text-sm text-ink-400">{app.user?.email}</p>
                  {app.eligibility && (
                    <p className="mt-1 text-xs text-ink-400">
                      Requested ₹{app.eligibility.requestedAmount.toLocaleString("en-IN")} · Score{" "}
                      {app.eligibility.creditScore}
                    </p>
                  )}
                </div>
                <StatusPill status={app.status} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}