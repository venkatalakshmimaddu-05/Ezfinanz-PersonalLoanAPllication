import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, apiErrorMessage } from "../../api/client";
import type { LoanApplication } from "../../types";
import { Card, Button, ErrorText } from "../../components/ui";
import { StatusPill } from "../../components/StatusPill";

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [apps, setApps] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    api
      .get("/applications")
      .then(({ data }) => setApps(data))
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  async function startNewApplication() {
    setStarting(true);
    setError(null);
    try {
      const { data } = await api.post("/applications", {});
      navigate(`/application/${data.id}`);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setStarting(false);
    }
  }

  const hasActiveApp = apps.some((a) => !["REJECTED", "DISBURSED"].includes(a.status));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink-900 sm:text-2xl">
            Your applications
          </h1>
          <p className="mt-1 text-sm text-ink-400">Track and continue your loan applications.</p>
        </div>
        {!hasActiveApp && (
          <Button onClick={startNewApplication} disabled={starting} className="w-full sm:w-auto">
            {starting ? "Starting…" : "+ New application"}
          </Button>
        )}
      </div>

      <ErrorText>{error}</ErrorText>

      {loading ? (
        <div className="mt-8 flex flex-col gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-ink-100/70" />
          ))}
        </div>
      ) : apps.length === 0 ? (
        <Card className="mt-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-signal-100 text-xl">
            💳
          </div>
          <p className="font-medium text-ink-900">You haven't started an application yet.</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-400">
            It takes about 10 minutes: KYC, eligibility check, EMI plan, bank details, and a
            selfie for verification.
          </p>
          <Button onClick={startNewApplication} disabled={starting} className="mt-5 w-full sm:w-auto">
            {starting ? "Starting…" : "Start application"}
          </Button>
        </Card>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {apps.map((app) => (
            <Card key={app.id} onClick={() => navigate(`/application/${app.id}`)}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-ink-400">#{app.id.slice(0, 8)}</p>
                  <p className="mt-1 text-sm text-ink-600">
                    Started {new Date(app.createdAt).toLocaleDateString()}
                  </p>
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