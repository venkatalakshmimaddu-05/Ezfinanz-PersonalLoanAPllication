import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../types";

export function ProtectedRoute({
  children,
  requireRole,
}: {
  children: ReactNode;
  requireRole?: Role;
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

  return <>{children}</>;
}
