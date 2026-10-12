// Leave list page — shows a filterable, sortable, paginated table of requests.
// Employees see their own; managers see their team; admins see everything.

import { useState } from "react";
import { Link } from "react-router-dom";
import { useGetLeaveRequestsQuery, useGetLeaveTypesQuery } from "../../api/leaveApi";
import { useAuth } from "../../hooks/useAuth";
import LoadingSpinner from "../../components/LoadingSpinner";
import StatusBadge from "../../components/StatusBadge";
import Pagination from "../../components/Pagination";
import ApiError from "../../components/ApiError";
import { LeaveStatus } from "../../types";

const PAGE_SIZE = 10;

export default function LeaveListPage() {
  const { isEmployee } = useAuth();
  const { data: leaveTypes } = useGetLeaveTypesQuery();

  // Filter state
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [ordering, setOrdering] = useState("-applied_on");

  const { data, isLoading, isError, error, refetch } = useGetLeaveRequestsQuery({
    page,
    search,
    status: status || undefined,
    leave_type: leaveType ? parseInt(leaveType) : undefined,
    ordering,
  });

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    setPage(1); // reset to first page on new search
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">LeaveFlow</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Leave requests</h2>
        </div>
        {isEmployee && (
          <Link
            to="/leaves/apply"
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-900/15 hover:-translate-y-0.5 hover:bg-blue-700"
          >
            Apply for Leave
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="mb-5 grid grid-cols-2 gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm md:grid-cols-4">
        <input
          type="text"
          placeholder="Search by name or reason..."
          value={search}
          onChange={handleSearch}
          className="border rounded px-3 py-2 text-sm col-span-2 md:col-span-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="border rounded px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={leaveType}
          onChange={(e) => { setLeaveType(e.target.value); setPage(1); }}
          className="border rounded px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">All Types</option>
          {leaveTypes?.map((lt) => (
            <option key={lt.id} value={lt.id}>{lt.name}</option>
          ))}
        </select>
        <select
          value={ordering}
          onChange={(e) => setOrdering(e.target.value)}
          className="border rounded px-3 py-2 text-sm focus:outline-none"
        >
          <option value="-applied_on">Newest First</option>
          <option value="applied_on">Oldest First</option>
          <option value="start_date">Start Date (asc)</option>
          <option value="-start_date">Start Date (desc)</option>
        </select>
      </div>

      {isError ? (
        <ApiError error={error} onRetry={() => void refetch()} />
      ) : isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Employee</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Type</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Dates</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Days</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Applied</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.results.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      No leave requests found.
                    </td>
                  </tr>
                )}
                {data?.results.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{req.employee_name}</td>
                    <td className="px-4 py-3">{req.leave_type_name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {req.start_date} &rarr; {req.end_date}
                    </td>
                    <td className="px-4 py-3">{req.num_days}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={req.status as LeaveStatus} />
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(req.applied_on).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/leaves/${req.id}`}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            count={data?.count ?? 0}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
