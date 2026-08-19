import { useState } from "react";
import { api, apiErrorMessage } from "../../../api/client";
import { Button, ErrorText } from "../../../components/ui";

export default function DeclarationStep({
  applicationId,
  onDone,
}: {
  applicationId: string;
  onDone: () => void;
}) {
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      await api.post(`/applications/${applicationId}/declaration`, { acceptedTerms: true });
      onDone();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-ink-900">Declaration</h2>
      <p className="mt-1 text-sm text-ink-400">Please review and confirm before we verify your identity.</p>

      <div className="mt-5 max-h-48 overflow-y-auto rounded-xl border border-ink-100 bg-ink-50 p-4 text-sm text-ink-600">
        <p>
          I declare that the information provided in this application — including income,
          employment, identity, and bank details — is true and complete to the best of my
          knowledge. I understand that providing false information may result in rejection of
          this application or cancellation of any loan issued as a result of it. I authorize
          EZFINANZ to verify these details, including a credit bureau check, and to contact me
          regarding this application.
        </p>
      </div>

      <label className="mt-4 flex items-start gap-2 text-sm text-ink-700">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
        />
        I have read and accept the declaration above.
      </label>

      <ErrorText>{error}</ErrorText>
      <Button onClick={handleSubmit} disabled={!accepted || loading} className="mt-6 w-full">
        {loading ? "Submitting…" : "Accept and continue"}
      </Button>
    </div>
  );
}
