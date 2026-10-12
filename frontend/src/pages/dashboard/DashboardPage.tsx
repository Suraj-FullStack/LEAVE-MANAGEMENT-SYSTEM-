// Dashboard — shows different stats depending on the user's role.

import { useGetDashboardQuery } from "../../api/leaveApi";
import { useAuth } from "../../hooks/useAuth";
import LoadingSpinner from "../../components/LoadingSpinner";
import ApiError from "../../components/ApiError";
import { EmployeeDashboard, ManagerDashboard, AdminDashboard, LeaveBalance } from "../../types";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useGetDashboardQuery();

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ApiError error={error} onRetry={() => void refetch()} />;
  if (!data || !user) return <p className="text-slate-500">No dashboard data available.</p>;

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-6 py-7 text-white shadow-lg shadow-blue-900/10 md:px-8 md:py-9">
        <div className="relative z-10 max-w-xl">
          <p className="text-sm font-semibold text-blue-100">Your workspace</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
            Welcome back, {user.first_name}
          </h2>
          <p className="mt-2 text-sm leading-6 text-blue-100">
            Here’s an overview of your leave activity and what needs your attention.
          </p>
        </div>
        <div aria-hidden="true" className="absolute -right-12 -top-24 h-72 w-72 rounded-full border-[36px] border-white/10" />
        <div aria-hidden="true" className="absolute -bottom-32 right-36 h-64 w-64 rounded-full bg-cyan-300/10 blur-2xl" />
      </section>

      {user.role === "employee" && (
        <div className="space-y-7">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
            <StatCard label="Total Requests" value={(data as EmployeeDashboard).total_requests} />
            <StatCard label="Pending" value={(data as EmployeeDashboard).pending} />
            <StatCard label="Approved" value={(data as EmployeeDashboard).approved} />
            <StatCard label="Rejected" value={(data as EmployeeDashboard).rejected} />
          </div>
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-bold tracking-tight text-slate-900">Leave balances</h3>
              <p className="mt-1 text-sm text-slate-500">Your current-year allowance by leave type.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {(data as EmployeeDashboard).balances.map((b: LeaveBalance) => (
              <div key={b.id} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                <p className="font-semibold text-slate-800">{b.leave_type_name}</p>
                <p className="mt-4 text-3xl font-bold tracking-tight text-blue-700">{b.days_available}</p>
                <p className="text-xs font-medium text-slate-500">days available</p>
                <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
                  <div className="flex justify-between">
                    <span>Total</span>
                    <span>{b.total_days} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taken</span>
                    <span>{b.days_taken} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending</span>
                    <span>{b.days_pending} days</span>
                  </div>
                </div>
              </div>
            ))}
            {!(data as EmployeeDashboard).balances.length && (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                No leave balances are set up yet. Please contact your administrator.
              </p>
            )}
            </div>
          </div>
        </div>
      )}

      {user.role === "manager" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard label="Team Requests" value={(data as ManagerDashboard).team_total} />
          <StatCard label="Pending Approvals" value={(data as ManagerDashboard).pending_approvals} />
          <StatCard label="Approved This Month" value={(data as ManagerDashboard).approved_this_month} />
        </div>
      )}

      {user.role === "admin" && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5 md:gap-5">
          <StatCard label="Total Requests" value={(data as AdminDashboard).total_requests} />
          <StatCard label="Pending" value={(data as AdminDashboard).pending} />
          <StatCard label="Approved" value={(data as AdminDashboard).approved} />
          <StatCard label="Rejected" value={(data as AdminDashboard).rejected} />
          <StatCard label="On Leave Today" value={(data as AdminDashboard).on_leave_today} />
        </div>
      )}
    </div>
  );
}
