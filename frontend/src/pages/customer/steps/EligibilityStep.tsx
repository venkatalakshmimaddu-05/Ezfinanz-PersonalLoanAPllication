import { useState } from "react";
import { api, apiErrorMessage } from "../../../api/client";
import { Button, FieldLabel, ErrorText, inputClass } from "../../../components/ui";

export default function EligibilityStep({
  applicationId,
  onDone,
}: {
  applicationId: string;
  onDone: () => void;
}) {
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [requestedAmount, setRequestedAmount] = useState("");
  const [employer, setEmployer] = useState("");
  const [existingDebt, setExistingDebt] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    result: string;
    dtiRatio: number;
    creditScore: number;
    applicationStatus: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post(`/applications/${applicationId}/eligibility`, {
        monthlyIncome: Number(monthlyIncome),
        requestedAmount: Number(requestedAmount),
        employer,
        existingDebt: Number(existingDebt),
      });
      setResult(data);
      if (data.applicationStatus !== "REJECTED") {
        setTimeout(onDone, 1200);
      }
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    const isRejected = result.applicationStatus === "REJECTED";
    return (
      <div className="py-4 text-center">
        <p className={`text-lg font-semibold ${isRejected ? "text-rose-500" : "text-signal-600"}`}>
          {result.result === "ELIGIBLE"
            ? "You're eligible!"
            : result.result === "PARTIALLY_ELIGIBLE"
            ? "Partially eligible"
            : "Not eligible at this time"}
        </p>
        <p className="mt-2 text-sm text-ink-600">
          Simulated credit score: <span className="font-mono">{result.creditScore}</span> · DTI:{" "}
          <span className="font-mono">{result.dtiRatio}%</span>
        </p>
        {!isRejected && <p className="mt-3 text-sm text-ink-400">Moving to EMI selection…</p>}
        {isRejected && (
          <p className="mt-3 text-sm text-ink-400">
            Your debt-to-income ratio or credit score doesn't currently meet our threshold.
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="font-display text-lg font-semibold text-ink-900">Eligibility check</h2>
      <p className="mt-1 text-sm text-ink-400">
        We'll run a simulated credit check and calculate your debt-to-income ratio.
      </p>

      <div className="mt-5 flex flex-col gap-4">
        <div>
          <FieldLabel>Monthly income (₹)</FieldLabel>
          <input
            required
            type="number"
            min={1}
            className={inputClass}
            value={monthlyIncome}
            onChange={(e) => setMonthlyIncome(e.target.value)}
          />
        </div>
        <div>
          <FieldLabel>Requested loan amount (₹)</FieldLabel>
          <input
            required
            type="number"
            min={1}
            className={inputClass}
            value={requestedAmount}
            onChange={(e) => setRequestedAmount(e.target.value)}
          />
        </div>
        <div>
          <FieldLabel>Employer</FieldLabel>
          <input required className={inputClass} value={employer} onChange={(e) => setEmployer(e.target.value)} />
        </div>
        <div>
          <FieldLabel>Existing monthly debt payments (₹)</FieldLabel>
          <input
            required
            type="number"
            min={0}
            className={inputClass}
            value={existingDebt}
            onChange={(e) => setExistingDebt(e.target.value)}
          />
        </div>
      </div>

      <ErrorText>{error}</ErrorText>
      <Button type="submit" disabled={loading} className="mt-6 w-full">
        {loading ? "Checking…" : "Check eligibility"}
      </Button>
    </form>
  );
}
