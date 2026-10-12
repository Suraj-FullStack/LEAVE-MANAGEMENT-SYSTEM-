// Root router — maps URL paths to pages and wraps private routes.

import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import LeaveListPage from "./pages/leaves/LeaveListPage";
import LeaveFormPage from "./pages/leaves/LeaveFormPage";
import LeaveDetailPage from "./pages/leaves/LeaveDetailPage";
import NotificationsPage from "./pages/notifications/NotificationsPage";
import UserManagementPage from "./pages/admin/UserManagementPage";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes — all wrapped in the shared Layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/leaves" element={<LeaveListPage />} />
          <Route path="/leaves/apply" element={<LeaveFormPage />} />
          <Route path="/leaves/:id" element={<LeaveDetailPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          {/* Admin-only */}
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <UserManagementPage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
