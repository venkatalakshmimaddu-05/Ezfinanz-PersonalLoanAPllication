import { Link } from "react-router-dom";
import { Button } from "../components/ui";



export default function Landing() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24">
      <span className="mb-4 rounded-full bg-signal-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-signal-600">
        Personal loans, transparently priced
      </span>
      <h1 className="max-w-2xl font-display text-3xl font-semibold leading-tight text-ink-900 sm:text-5xl">
        Apply in minutes. See the real cost before you sign.
      </h1>
      <p className="mt-5 max-w-xl text-sm text-ink-600 sm:text-base">
        EZFINANZ walks you through KYC, eligibility, EMI planning, and verification —
        showing the effective interest rate, not just the number on the poster.
      </p>
      <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Link to="/signup" className="w-full sm:w-auto">
          <Button className="w-full px-6 py-3 text-base sm:w-auto">Start application</Button>
        </Link>
        <Link to="/login" className="w-full sm:w-auto">
          <Button variant="secondary" className="w-full px-6 py-3 text-base sm:w-auto">
            Log in
          </Button>
        </Link>
      </div>
    </div>
  );
}