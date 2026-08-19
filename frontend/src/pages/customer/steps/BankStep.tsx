import { useState } from "react";
import { api, apiErrorMessage } from "../../../api/client";
import { Button, FieldLabel, ErrorText, inputClass } from "../../../components/ui";

export default function BankStep({
  applicationId,
  onDone,
}: {
  applicationId: string;
  onDone: () => void;
}) {
  const [holderName, setHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [bankName, setBankName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post(`/applications/${applicationId}/bank`, {
        holderName,
        accountNumber,
        ifsc: ifsc.toUpperCase(),
        bankName,
      });
      onDone();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="font-display text-lg font-semibold text-ink-900">Bank account details</h2>
      <p className="mt-1 text-sm text-ink-400">
        Disbursement account. We'll run a simulated penny-drop verification.
      </p>

      <div className="mt-5 flex flex-col gap-4">
        <div>
          <FieldLabel>Account holder name</FieldLabel>
          <input required className={inputClass} value={holderName} onChange={(e) => setHolderName(e.target.value)} />
        </div>
        <div>
          <FieldLabel>Account number</FieldLabel>
          <input
            required
            pattern="\d{9,18}"
            className={inputClass}
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
          />
        </div>
        <div>
          <FieldLabel>IFSC code</FieldLabel>
          <input
            required
            pattern="[A-Za-z]{4}0[A-Za-z0-9]{6}"
            placeholder="e.g. HDFC0001234"
            className={inputClass}
            value={ifsc}
            onChange={(e) => setIfsc(e.target.value)}
          />
        </div>
        <div>
          <FieldLabel>Bank name</FieldLabel>
          <input required className={inputClass} value={bankName} onChange={(e) => setBankName(e.target.value)} />
        </div>
      </div>

      <ErrorText>{error}</ErrorText>
      <Button type="submit" disabled={loading} className="mt-6 w-full">
        {loading ? "Verifying…" : "Verify and continue"}
      </Button>
    </form>
  );
}
