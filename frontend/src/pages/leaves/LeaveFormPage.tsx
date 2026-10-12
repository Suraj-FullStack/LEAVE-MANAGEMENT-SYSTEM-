// Apply for leave form — React Hook Form + Zod validation.
// Lets an employee pick a leave type, date range, and reason.

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useApplyLeaveMutation, useGetLeaveTypesQuery } from "../../api/leaveApi";
import { getApiErrorMessage } from "../../api/errorMessage";
import ApiError from "../../components/ApiError";

const schema = z
  .object({
    leave_type: z.string().min(1, "Select a leave type."),
    start_date: z.string().min(1, "Start date is required."),
    end_date: z.string().min(1, "End date is required."),
    reason: z.string().min(10, "Reason must be at least 10 characters."),
  })
  .refine((d) => new Date(d.end_date) >= new Date(d.start_date), {
    message: "End date must be on or after start date.",
    path: ["end_date"],
  });

type FormValues = z.infer<typeof schema>;

export default function LeaveFormPage() {
  const navigate = useNavigate();
  const {
    data: leaveTypes,
    isLoading: typesLoading,
    isError: typesError,
    error: typesErrorDetail,
    refetch: refetchTypes,
  } = useGetLeaveTypesQuery();
  const [applyLeave, { isLoading }] = useApplyLeaveMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormValues) {
    try {
      await applyLeave({
        leave_type: parseInt(data.leave_type),
        start_date: data.start_date,
        end_date: data.end_date,
        reason: data.reason,
      }).unwrap();
      toast.success("Leave request submitted.");
      navigate("/leaves");
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to submit request."));
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Time away</p>
      <h2 className="mb-2 mt-1 text-2xl font-bold tracking-tight text-slate-900">Apply for leave</h2>
      <p className="mb-6 text-sm text-slate-500">Share your dates and a short reason for your request.</p>
      {typesError && <div className="mb-4"><ApiError error={typesErrorDetail} onRetry={() => void refetchTypes()} /></div>}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
            <select
              {...register("leave_type")}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select type...</option>
              {leaveTypes?.map((lt) => (
                <option key={lt.id} value={lt.id}>
                  {lt.name} (max {lt.max_days_per_year} days/year)
                </option>
              ))}
            </select>
            {errors.leave_type && (
              <p className="text-red-500 text-xs mt-1">{errors.leave_type.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                {...register("start_date")}
                type="date"
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.start_date && (
                <p className="text-red-500 text-xs mt-1">{errors.start_date.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                {...register("end_date")}
                type="date"
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.end_date && (
                <p className="text-red-500 text-xs mt-1">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <textarea
              {...register("reason")}
              rows={4}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Briefly explain why you need leave..."
            />
            {errors.reason && (
              <p className="text-red-500 text-xs mt-1">{errors.reason.message}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading || typesLoading || typesError}
              className="bg-blue-600 text-white px-6 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Submitting..." : "Submit Request"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/leaves")}
              className="bg-gray-100 text-gray-700 px-6 py-2 rounded text-sm font-medium hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
