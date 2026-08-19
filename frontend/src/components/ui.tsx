import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Card({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const interactive = Boolean(onClick);
  return (
    <div
      className={`rounded-2xl border border-ink-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,22,38,0.04)] sm:p-6 ${
        interactive
          ? "cursor-pointer transition hover:-translate-y-0.5 hover:border-ink-200 hover:shadow-[0_8px_24px_rgba(15,22,38,0.08)] active:translate-y-0"
          : ""
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}

export function Button({ variant = "primary", className = "", children, ...rest }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";
  const styles = {
    primary: "bg-ink-900 text-white shadow-sm hover:bg-ink-800",
    secondary: "bg-ink-100 text-ink-900 hover:bg-ink-200",
    danger: "bg-rose-500 text-white shadow-sm hover:bg-rose-500/90",
    ghost: "bg-transparent text-ink-600 hover:bg-ink-100",
  };
  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-sm font-medium text-ink-700">{children}</label>;
}

export function ErrorText({ children }: { children?: string | null }) {
  if (!children) return null;
  return (
    <p className="mt-2 flex items-start gap-2 rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-500">
      <span aria-hidden>⚠</span>
      {children}
    </p>
  );
}

export const inputClass =
  "w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-signal-500 focus:ring-4 focus:ring-signal-100 outline-none transition";