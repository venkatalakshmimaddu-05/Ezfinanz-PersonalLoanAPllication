import { useState } from "react";
import { api, apiErrorMessage } from "../../../api/client";
import { Button, ErrorText } from "../../../components/ui";

export default function SelfieStep({
  applicationId,
  onDone,
}: {
  applicationId: string;
  onDone: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleFile(f: File | null) {
    setFile(f);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  }

  async function handleSubmit() {
    if (!file) {
      setError("Please select a selfie photo");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("selfie", file);
      await api.post(`/applications/${applicationId}/selfie`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onDone();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-ink-900">Selfie verification</h2>
      <p className="mt-1 text-sm text-ink-400">
        Upload a clear selfie so our team can confirm it's really you before final approval.
      </p>

      <div className="mt-5 flex flex-col items-center gap-4">
        {previewUrl ? (
          <img src={previewUrl} alt="Selfie preview" className="h-48 w-48 rounded-2xl object-cover" />
        ) : (
          <div className="flex h-48 w-48 items-center justify-center rounded-2xl border-2 border-dashed border-ink-200 text-sm text-ink-400">
            No photo selected
          </div>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          className="text-sm text-ink-600"
        />
      </div>

      <ErrorText>{error}</ErrorText>
      <Button onClick={handleSubmit} disabled={loading} className="mt-6 w-full">
        {loading ? "Submitting…" : "Submit for review"}
      </Button>
    </div>
  );
}
