import { useState } from "react";
import { api, apiErrorMessage } from "../../../api/client";
import { Button, FieldLabel, ErrorText, inputClass } from "../../../components/ui";

export default function KycStep({
  applicationId,
  onDone,
}: {
  applicationId: string;
  onDone: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("MALE");
  const [address, setAddress] = useState("");
  const [idType, setIdType] = useState("PAN");
  const [idNumber, setIdNumber] = useState("");
  const [idPhoto, setIdPhoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("fullName", fullName);
      formData.append("dob", dob);
      formData.append("gender", gender);
      formData.append("address", address);
      formData.append("idType", idType);
      formData.append("idNumber", idNumber);
      if (idPhoto) formData.append("idPhoto", idPhoto);

      await api.post(`/applications/${applicationId}/kyc`, formData, {
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
    <form onSubmit={handleSubmit}>
      <h2 className="font-display text-lg font-semibold text-ink-900">Identity verification (KYC)</h2>
      <p className="mt-1 text-sm text-ink-400">Tell us who you are — this stays on file for compliance.</p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FieldLabel>Full legal name</FieldLabel>
          <input required className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <FieldLabel>Date of birth</FieldLabel>
          <input required type="date" className={inputClass} value={dob} onChange={(e) => setDob(e.target.value)} />
        </div>
        <div>
          <FieldLabel>Gender</FieldLabel>
          <select required className={inputClass} value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <FieldLabel>Address</FieldLabel>
          <textarea
            required
            rows={2}
            className={inputClass}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
        <div>
          <FieldLabel>ID type</FieldLabel>
          <select required className={inputClass} value={idType} onChange={(e) => setIdType(e.target.value)}>
            <option value="PAN">PAN</option>
            <option value="AADHAAR">Aadhaar</option>
            <option value="PASSPORT">Passport</option>
          </select>
        </div>
        <div>
          <FieldLabel>ID number</FieldLabel>
          <input required className={inputClass} value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel>ID photo (optional in this demo)</FieldLabel>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="text-sm text-ink-600"
            onChange={(e) => setIdPhoto(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>

      <ErrorText>{error}</ErrorText>
      <Button type="submit" disabled={loading} className="mt-6 w-full">
        {loading ? "Saving…" : "Continue"}
      </Button>
    </form>
  );
}
