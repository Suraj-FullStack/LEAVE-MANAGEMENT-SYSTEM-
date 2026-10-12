// Detail page for a single leave request.
// Shows all info; managers/admins get approve and reject buttons.

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  useGetLeaveRequestQuery,
  useApproveLeaveMutation,
  useRejectLeaveMutation,
  useCancelLeaveMutation,
} from "../../api/leaveApi";
import { useAuth } from "../../hooks/useAuth";
import LoadingSpinner from "../../components/LoadingSpinner";
import StatusBadge from "../../components/StatusBadge";
import { LeaveStatus } from "../../types";
import { getApiErrorMessage } from "../../api/errorMessage";
import ApiError from "../../components/ApiError";

export default function LeaveDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isManagerOrAdmin, user } = useAuth();
  const [comment, setComment] = useState("");

  const {
    data: req,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetLeaveRequestQuery(id ?? "", { skip: !id });
  const [approve, { isLoading: approving }] = useApproveLeaveMutation();
  const [reject, { isLoading: rejecting }] = useRejectLeaveMutation();
  const [cancel, { isLoading: cancelling }] = useCancelLeaveMutation();

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ApiError error={error} onRetry={() => void refetch()} />;
  if (!req) return <p className="text-slate-500">Request not found.</p>;

  async function handleApprove() {
    try {
      await approve({ id: req!.id, comment }).unwrap();
      toast.success("Leave approved.");
      navigate("/leaves");
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to approve."));
    }
  }

  async function handleReject() {
    if (!comment.trim()) {
      toast.error("Please enter a reason for rejection.");
      return;
    }
    try {
      await reject({ id: req!.id, comment }).unwrap();
      toast.success("Leave rejected.");
      navigate("/leaves");
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to reject."));
    }
  }

  async function handleCancel() {
    if (!confirm("Cancel this leave request?")) return;
    try {
      await cancel(req!.id).unwrap();
      toast.success("Leave request cancelled.");
      navigate("/leaves");
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to cancel."));
    }
  }

  const isOwner = user?.id === req.employee;
  const canCancel = isOwner && (req.status === "pending" || req.status === "approved");
  const canReview = isManagerOrAdmin && req.status === "pending";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Request detail</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Leave request</h2>
        </div>
        <StatusBadge status={req.status as LeaveStatus} />
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8 space-y-4 text-sm">
        <Row label="Employee" value={req.employee_name} />
        <Row label="Leave Type" value={req.leave_type_name} />
        <Row label="From" value={req.start_date} />
        <Row label="To" value={req.end_date} />
        <Row label="Number of Days" value={String(req.num_days)} />
        <Row label="Reason" value={req.reason} />
        <Row label="Applied On" value={new Date(req.applied_on).toLocaleString()} />
        {req.reviewed_by_name && (
          <>
            <Row label="Reviewed By" value={req.reviewed_by_name} />
            <Row label="Reviewed On" value={new Date(req.reviewed_on!).toLocaleString()} />
            {req.manager_comment && (
              <Row label="Manager Comment" value={req.manager_comment} />
            )}
          </>
        )}
      </div>

      {/* Approval/rejection form for managers and admins */}
      {canReview && (
        <div className="mt-4 space-y-3 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <label className="block text-sm font-medium text-gray-700">
            Comment (required for rejection)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Add a comment..."
          />
          <div className="flex gap-3">
            <button
              onClick={handleApprove}
              disabled={approving}
              className="bg-green-600 text-white px-5 py-2 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {approving ? "Approving..." : "Approve"}
            </button>
            <button
              onClick={handleReject}
              disabled={rejecting}
              className="bg-red-600 text-white px-5 py-2 rounded text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {rejecting ? "Rejecting..." : "Reject"}
            </button>
          </div>
        </div>
      )}

      {canCancel && (
        <div className="mt-4">
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="bg-gray-200 text-gray-800 px-5 py-2 rounded text-sm font-medium hover:bg-gray-300 disabled:opacity-50"
          >
            {cancelling ? "Cancelling..." : "Cancel Request"}
          </button>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <span className="w-36 text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-800">{value}</span>
    </div>
  );
}
