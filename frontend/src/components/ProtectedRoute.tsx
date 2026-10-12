// Redirects unauthenticated users to /login.
// Also handles role-based access: blocks if user's role isn't in allowedRoles.

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Role } from "../types";

interface Props {
  allowedRoles?: Role[];
  children?: React.ReactNode;
}

export default function ProtectedRoute({ allowedRoles, children }: Props) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If specific roles are required, check them
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // If children are passed (e.g. wrapping a single page), render them
  // Otherwise render the nested route via Outlet
  return children ? <>{children}</> : <Outlet />;
}
