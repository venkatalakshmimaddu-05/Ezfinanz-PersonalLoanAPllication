import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui";

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-10 border-b border-ink-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4">
        <Link
          to={user ? (user.role === "ADMIN" ? "/admin" : "/dashboard") : "/"}
          className="flex items-center gap-2"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900 font-display text-sm font-bold text-signal-400">
            EZ
          </span>
          <span className="font-display text-lg font-semibold text-ink-900">EZFINANZ</span>
        </Link>
        {user && (
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden items-center gap-2 sm:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-100 text-xs font-semibold text-ink-700">
                {initials(user.name)}
              </span>
              <span className="text-sm text-ink-400">
                <span className="text-ink-700">{user.name}</span>
                <span className="mx-1.5 text-ink-200">·</span>
                {user.role === "ADMIN" ? "Admin" : "Customer"}
              </span>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-100 text-xs font-semibold text-ink-700 sm:hidden">
              {initials(user.name)}
            </span>
            <Button
              variant="secondary"
              className="px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              Log out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}