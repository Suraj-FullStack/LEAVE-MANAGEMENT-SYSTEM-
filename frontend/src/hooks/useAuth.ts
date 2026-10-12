// Custom hook that reads auth state from Redux and exposes helpers.
// Components use this instead of touching the store directly.

import { useAppSelector } from "../store";

export function useAuth() {
  const { user, accessToken } = useAppSelector((state) => state.auth);

  const isAuthenticated = !!accessToken && !!user;
  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";
  const isEmployee = user?.role === "employee";
  const isManagerOrAdmin = isManager || isAdmin;

  return { user, isAuthenticated, isAdmin, isManager, isEmployee, isManagerOrAdmin };
}
