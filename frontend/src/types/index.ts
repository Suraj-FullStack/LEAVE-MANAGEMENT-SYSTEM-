// Shared TypeScript types used across API slices, components, and pages.

export type Role = "admin" | "manager" | "employee";
export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: Role;
  department: string;
  manager: string | null;
  manager_name: string | null;
  is_active: boolean;
  date_joined: string;
}

export interface LeaveType {
  id: number;
  name: string;
  max_days_per_year: number;
  description: string;
}

export interface LeaveBalance {
  id: number;
  leave_type: number;
  leave_type_name: string;
  year: number;
  total_days: number;
  days_taken: number;
  days_pending: number;
  days_available: number;
}

export interface LeaveRequest {
  id: string;
  employee: string;
  employee_name: string;
  leave_type: number;
  leave_type_name: string;
  start_date: string;
  end_date: string;
  num_days: number;
  reason: string;
  status: LeaveStatus;
  applied_on: string;
  reviewed_by: string | null;
  reviewed_by_name: string | null;
  reviewed_on: string | null;
  manager_comment: string;
}

export interface Notification {
  id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

// What the backend returns for paginated list endpoints
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Dashboard data shapes differ by role so we use a union
export interface EmployeeDashboard {
  total_requests: number;
  pending: number;
  approved: number;
  rejected: number;
  balances: LeaveBalance[];
}

export interface ManagerDashboard {
  team_total: number;
  pending_approvals: number;
  approved_this_month: number;
}

export interface AdminDashboard {
  total_requests: number;
  pending: number;
  approved: number;
  rejected: number;
  on_leave_today: number;
}
