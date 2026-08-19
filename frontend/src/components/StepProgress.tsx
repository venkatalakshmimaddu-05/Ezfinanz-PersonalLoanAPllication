import type { ApplicationStatus } from "../types";

const STEP_ORDER: ApplicationStatus[] = [
  "KYC_PENDING",
  "ELIGIBILITY_PENDING",
  "EMI_PENDING",
  "BANK_PENDING",
  "DECLARATION_PENDING",
  "SELFIE_PENDING",
  "ADMIN_REVIEW",
];

const STEP_LABELS = ["KYC", "Eligibility", "EMI", "Bank", "Declare", "Selfie", "Review"];

export function StepProgress({ status }: { status: ApplicationStatus }) {
  const currentIndex = STEP_ORDER.indexOf(status);
  const isTerminal = ["APPROVED", "REJECTED", "DISBURSED"].includes(status);
  const stepNumber = isTerminal ? STEP_LABELS.length : currentIndex + 1;
  const percent = Math.min(100, (stepNumber / STEP_LABELS.length) * 100);

  return (
    <div>
      {/* Compact version for narrow screens: current step + a slim bar */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-ink-900">
            Step {stepNumber} of {STEP_LABELS.length}: {STEP_LABELS[Math.min(currentIndex, STEP_LABELS.length - 1)] ?? "Review"}
          </span>
          <span className="text-ink-400">{Math.round(percent)}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
          <div
            className="h-full rounded-full bg-signal-500 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Full step row for sm+ screens */}
      <div className="hidden items-center gap-1 overflow-x-auto pb-1 sm:flex">
        {STEP_LABELS.map((label, i) => {
          const done = isTerminal || i < currentIndex;
          const active = !isTerminal && i === currentIndex;
          return (
            <div key={label} className="flex shrink-0 items-center gap-1">
              <div
                className={`flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${
                  done
                    ? "bg-signal-500 text-white"
                    : active
                    ? "bg-ink-900 text-white"
                    : "bg-ink-100 text-ink-400"
                }`}
              >
                {done ? "✓" : i + 1}
              </div>
              <span
                className={`text-xs whitespace-nowrap ${
                  active ? "font-medium text-ink-900" : "text-ink-400"
                }`}
              >
                {label}
              </span>
              {i < STEP_LABELS.length - 1 && <div className="mx-1 h-px w-4 bg-ink-200" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}