import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, apiErrorMessage } from "../api/client";
import { Card, Button, FieldLabel, ErrorText, inputClass } from "../components/ui";

export default function Verify() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function sendOtp() {
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post("/auth/otp/request", { channel: "phone" });
      setDevCode(data.devOnlyCode); // shown only because there's no real SMS gateway in this demo
      setSent(true);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/auth/otp/verify", { channel: "phone", code });
      navigate("/dashboard");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="font-display text-2xl font-semibold text-ink-900">Verify your phone</h1>
      <p className="mt-1 text-sm text-ink-400">
        We'll send a 6-digit code. (This demo simulates SMS — the code appears on screen instead
        of being texted.)
      </p>

      <Card className="mt-6">
        {!sent ? (
          <Button onClick={sendOtp} disabled={loading} className="w-full">
            {loading ? "Sending…" : "Send code"}
          </Button>
        ) : (
          <form onSubmit={handleVerify}>
            {devCode && (
              <p className="mb-4 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-500">
                Simulated code sent: <strong className="font-mono">{devCode}</strong>
              </p>
            )}
            <FieldLabel>6-digit code</FieldLabel>
            <input
              required
              maxLength={6}
              pattern="\d{6}"
              className={inputClass}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
            />
            <ErrorText>{error}</ErrorText>
            <Button type="submit" disabled={loading} className="mt-5 w-full">
              {loading ? "Verifying…" : "Verify"}
            </Button>
            <button
              type="button"
              onClick={sendOtp}
              className="mt-3 w-full text-center text-sm text-ink-400 underline"
            >
              Resend code
            </button>
          </form>
        )}
      </Card>

      <button
        onClick={() => navigate("/dashboard")}
        className="mt-5 text-center text-sm text-ink-400 underline"
      >
        Skip for now
      </button>
    </div>
  );
}
