import { useState, useEffect, useCallback } from "react";
import { api, apiErrorMessage } from "../../../api/client";
import { Button, FieldLabel, ErrorText, inputClass } from "../../../components/ui";

interface Preview {
  emi: number;
  processingFee: number;
  gst: number;
  netDisbursement: number;
  totalInterest: number;
  totalRepayment: number;
  irrAnnual: number;
}

function formatINR(n: number) {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export default function EmiStep({
  applicationId,
  requestedAmount,
  onDone,
}: {
  applicationId: string;
  requestedAmount?: number;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState(requestedAmount ?? 500000);
  const [tenureMonths, setTenureMonths] = useState(24);
  const [interestRate, setInterestRate] = useState(14);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchPreview = useCallback(async () => {
    setPreviewLoading(true);
    try {
      const { data } = await api.post("/applications/emi/preview", {
        amount,
        tenureMonths,
        interestRate,
      });
      setPreview(data);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setPreviewLoading(false);
    }
  }, [amount, tenureMonths, interestRate]);

  useEffect(() => {
    const t = setTimeout(fetchPreview, 250); // debounce slider drags
    return () => clearTimeout(t);
  }, [fetchPreview]);

  async function confirmSelection() {
    setError(null);
    setLoading(true);
    try {
      await api.post(`/applications/${applicationId}/emi`, { amount, tenureMonths, interestRate });
      onDone();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-ink-900">Choose your EMI plan</h2>
      <p className="mt-1 text-sm text-ink-400">
        Adjust amount and tenure to see the real numbers, including the effective annual rate
        after fees.
      </p>

      <div className="mt-6 flex flex-col gap-5">
        <div>
          <div className="flex justify-between">
            <FieldLabel>Loan amount</FieldLabel>
            <span className="text-sm font-medium stat-mono text-ink-900">{formatINR(amount)}</span>
          </div>
          <input
            type="range"
            min={50000}
            max={2000000}
            step={10000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full accent-signal-500"
          />
        </div>

        <div>
          <div className="flex justify-between">
            <FieldLabel>Tenure</FieldLabel>
            <span className="text-sm font-medium stat-mono text-ink-900">{tenureMonths} months</span>
          </div>
          <input
            type="range"
            min={3}
            max={84}
            step={1}
            value={tenureMonths}
            onChange={(e) => setTenureMonths(Number(e.target.value))}
            className="w-full accent-signal-500"
          />
        </div>

        <div>
          <FieldLabel>Interest rate (annual, nominal)</FieldLabel>
          <input
            type="number"
            step={0.1}
            min={1}
            max={30}
            className={inputClass}
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-ink-100 bg-ink-50 p-4 sm:p-5">
        {previewLoading && !preview ? (
          <p className="text-sm text-ink-400">Calculating…</p>
        ) : preview ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white p-3.5">
                <p className="text-xs text-ink-400">Monthly EMI</p>
                <p className="mt-1 stat-mono text-xl font-semibold text-ink-900 sm:text-2xl">
                  {formatINR(preview.emi)}
                </p>
              </div>
              <div className="rounded-xl bg-white p-3.5">
                <p className="text-xs text-ink-400">Effective annual rate</p>
                <p className="mt-1 stat-mono text-xl font-semibold text-signal-600 sm:text-2xl">
                  {preview.irrAnnual}%
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col divide-y divide-ink-100 text-sm">
              <div className="flex justify-between py-2">
                <span className="text-ink-400">Processing fee + GST</span>
                <span className="stat-mono text-ink-600">
                  {formatINR(preview.processingFee + preview.gst)}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-ink-400">Net amount you'll receive</span>
                <span className="stat-mono text-ink-600">{formatINR(preview.netDisbursement)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-ink-400">Total interest</span>
                <span className="stat-mono text-ink-600">{formatINR(preview.totalInterest)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-ink-400">Total repayment</span>
                <span className="stat-mono text-ink-600">{formatINR(preview.totalRepayment)}</span>
              </div>
            </div>
          </>
        ) : null}
        <p className="mt-3 text-xs text-ink-400">
          The effective rate is higher than the nominal {interestRate}% because the processing fee
          and GST are deducted up front, but you repay based on the full loan amount.
        </p>
      </div>

      <ErrorText>{error}</ErrorText>
      <Button onClick={confirmSelection} disabled={loading || !preview} className="mt-6 w-full">
        {loading ? "Confirming…" : "Confirm this plan"}
      </Button>
    </div>
  );
}