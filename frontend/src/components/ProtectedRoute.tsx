import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../types";

export function ProtectedRoute({
  children,
  requireRole,
  requireVerified,
}: {
  children: ReactNode;
  requireRole?: Role;
  /** When true, redirects to /verify unless both email and phone are verified.
   * Admin routes never need this — only customer-facing application routes. */
  requireVerified?: boolean;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-ink-400">
        Loading…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Role is re-checked server-side on every admin API call too — this
  // client-side gate is only for UX (redirecting to the right dashboard),
  // never the actual security boundary.
  if (requireRole && user.role !== requireRole) {
    return <Navigate to={user.role === "ADMIN" ? "/admin" : "/dashboard"} replace />;
  }

  // Same principle: this is a UX convenience. The backend independently
  // rejects application creation for unverified users, so this can't be
  // bypassed just by calling the API directly.
  if (requireVerified && (!user.emailVerified || !user.phoneVerified)) {
    return <Navigate to="/verify" replace />;
  }

  return <>{children}</>;
}