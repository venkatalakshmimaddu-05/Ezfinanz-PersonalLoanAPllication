import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, apiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Card, Button, FieldLabel, ErrorText, inputClass } from "../components/ui";

type Channel = "email" | "phone";

/**
 * Both email and phone must be verified before a customer can reach the
 * loan application flow — enforced here for UX, and separately re-checked
 * server-side on application creation, since a client-side skip button is
 * not a real security boundary.
 */
export default function Verify() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  if (user?.emailVerified && user?.phoneVerified) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="font-display text-2xl font-semibold text-ink-900">Verify your account</h1>
      <p className="mt-1 text-sm text-ink-400">
        Both your email and phone number must be verified before you can start a loan
        application.
      </p>

      <div className="mt-6 flex gap-2">
        <StepBadge label="Email" done={!!user?.emailVerified} />
        <StepBadge label="Phone" done={!!user?.phoneVerified} />
      </div>

      <Card className="mt-4">
        {!user?.emailVerified ? (
          <OtpForm
            channel="email"
            description="We'll send a 6-digit code to your email address."
            onVerified={async () => {
              await refreshUser();
            }}
          />
        ) : !user?.phoneVerified ? (
          <OtpForm
            channel="phone"
            description="We'll send a 6-digit code to your phone number."
            onVerified={async () => {
              await refreshUser();
              navigate("/dashboard");
            }}
          />
        ) : null}
      </Card>
    </div>
  );
}

function StepBadge({ label, done }: { label: string; done: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
        done ? "bg-signal-100 text-signal-600" : "bg-ink-100 text-ink-600"
      }`}
    >
      {done ? "✓" : "○"} {label}
    </span>
  );
}

function OtpForm({
  channel,
  description,
  onVerified,
}: {
  channel: Channel;
  description: string;
  onVerified: () => void;
}) {
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function sendOtp() {
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post("/auth/otp/request", { channel });
      // devOnlyCode is returned ONLY because this demo has no real SMS/email
      // gateway wired up — a production build would never expose this and
      // would rely entirely on the real delivery channel.
      setDevCode(data.devOnlyCode);
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
      await api.post("/auth/otp/verify", { channel, code });
      onVerified();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="text-sm text-ink-400">{description}</p>
      <p className="mt-1 text-xs text-amber-500">
        Simulated {channel === "email" ? "email" : "SMS"} delivery — no real{" "}
        {channel === "email" ? "email" : "text message"} is sent in this demo; the code is shown
        on screen instead.
      </p>

      {!sent ? (
        <Button onClick={sendOtp} disabled={loading} className="mt-4 w-full">
          {loading ? "Sending…" : `Send code to my ${channel}`}
        </Button>
      ) : (
        <form onSubmit={handleVerify} className="mt-4">
          {devCode && (
            <p className="mb-4 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-500">
              Simulated code: <strong className="font-mono">{devCode}</strong>
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
    </div>
  );
}