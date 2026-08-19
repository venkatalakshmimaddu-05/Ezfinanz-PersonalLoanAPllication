import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiErrorMessage } from "../api/client";
import { Card, Button, FieldLabel, ErrorText, inputClass } from "../components/ui";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signup(name, email, phone, password);
      navigate("/verify");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="font-display text-2xl font-semibold text-ink-900">Create your account</h1>
      <p className="mt-1 text-sm text-ink-400">Takes about a minute.</p>

      <Card className="mt-6">
        <form onSubmit={handleSubmit}>
          <FieldLabel>Full name</FieldLabel>
          <input
            required
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Asha Rao"
          />
          <div className="mt-4">
            <FieldLabel>Email</FieldLabel>
            <input
              type="email"
              required
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="mt-4">
            <FieldLabel>Phone (10 digits)</FieldLabel>
            <input
              required
              pattern="\d{10}"
              className={inputClass}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9876543210"
            />
          </div>
          <div className="mt-4">
            <FieldLabel>Password</FieldLabel>
            <input
              type="password"
              required
              minLength={8}
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>
          <ErrorText>{error}</ErrorText>
          <Button type="submit" disabled={loading} className="mt-5 w-full">
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>
      </Card>

      <p className="mt-5 text-center text-sm text-ink-400">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-ink-900 underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
