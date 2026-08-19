import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiErrorMessage } from "../api/client";
import { Card, Button, FieldLabel, ErrorText, inputClass } from "../components/ui";

export default function Login() {
  const { login, loginWithGoogleSimulated, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    try {
      // SIMULATED: a real integration would open Google's OAuth consent
      // screen and verify the returned id_token server-side. Here we
      // prompt for the profile that screen would have returned.
      const demoEmail = window.prompt("Simulated Google login — enter email:");
      const demoName = window.prompt("Simulated Google login — enter name:");
      if (!demoEmail || !demoName) return;
      await loginWithGoogleSimulated(demoEmail, demoName);
      navigate("/dashboard");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (user) navigate(user.role === "ADMIN" ? "/admin" : "/dashboard");

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="font-display text-2xl font-semibold text-ink-900">Welcome back</h1>
      <p className="mt-1 text-sm text-ink-400">Log in to continue your application.</p>

      <Card className="mt-6">
        <form onSubmit={handleSubmit}>
          <FieldLabel>Email</FieldLabel>
          <input
            type="email"
            required
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <div className="mt-4">
            <FieldLabel>Password</FieldLabel>
            <input
              type="password"
              required
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <ErrorText>{error}</ErrorText>
          <Button type="submit" disabled={loading} className="mt-5 w-full">
            {loading ? "Logging in…" : "Log in"}
          </Button>
        </form>
        <div className="my-4 flex items-center gap-3 text-xs text-ink-400">
          <div className="h-px flex-1 bg-ink-100" />
          or
          <div className="h-px flex-1 bg-ink-100" />
        </div>
        <Button variant="secondary" onClick={handleGoogle} disabled={loading} className="w-full">
          Continue with Google (simulated)
        </Button>
      </Card>

      <p className="mt-5 text-center text-sm text-ink-400">
        New here?{" "}
        <Link to="/signup" className="font-medium text-ink-900 underline">
          Create an account
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-ink-400">
        Admin demo login: admin@ezfinanz.com / Admin@12345
      </p>
    </div>
  );
}
