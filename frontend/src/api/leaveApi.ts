// Leave API slice — leave types, balances, requests, approve/reject, dashboard.

import { baseApi } from "./baseApi";
import {
  LeaveType,
  LeaveBalance,
  LeaveRequest,
  PaginatedResponse,
  EmployeeDashboard,
  ManagerDashboard,
  AdminDashboard,
} from "../types";

interface LeaveRequestParams {
  page?: number;
  status?: string;
  leave_type?: number;
  department?: string;
  start_date_from?: string;
  start_date_to?: string;
  search?: string;
  ordering?: string;
}

interface ApplyLeaveBody {
  leave_type: number;
  start_date: string;
  end_date: string;
  reason: string;
}

interface ReviewBody {
  comment?: string;
}

export const leaveApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLeaveTypes: builder.query<LeaveType[], void>({
      query: () => "/leaves/types/",
    }),
    getLeaveBalances: builder.query<LeaveBalance[], { year?: number }>({
      query: (params) => ({ url: "/leaves/balances/", params }),
      providesTags: ["LeaveBalance"],
    }),
    getLeaveRequests: builder.query<PaginatedResponse<LeaveRequest>, LeaveRequestParams>({
      query: (params) => ({ url: "/leaves/requests/", params }),
      providesTags: ["LeaveRequest"],
    }),
    getLeaveRequest: builder.query<LeaveRequest, string>({
      query: (id) => `/leaves/requests/${id}/`,
      providesTags: (_result, _err, id) => [{ type: "LeaveRequest", id }],
    }),
    applyLeave: builder.mutation<LeaveRequest, ApplyLeaveBody>({
      query: (body) => ({
        url: "/leaves/requests/apply/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["LeaveRequest", "LeaveBalance"],
    }),
    cancelLeave: builder.mutation<LeaveRequest, string>({
      query: (id) => ({
        url: `/leaves/requests/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["LeaveRequest", "LeaveBalance"],
    }),
    approveLeave: builder.mutation<LeaveRequest, { id: string } & ReviewBody>({
      query: ({ id, ...body }) => ({
        url: `/leaves/requests/${id}/approve/`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["LeaveRequest"],
    }),
    rejectLeave: builder.mutation<LeaveRequest, { id: string } & ReviewBody>({
      query: ({ id, ...body }) => ({
        url: `/leaves/requests/${id}/reject/`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["LeaveRequest"],
    }),
    getDashboard: builder.query<EmployeeDashboard | ManagerDashboard | AdminDashboard, void>({
      query: () => "/leaves/dashboard/",
    }),
  }),
});

export const {
  useGetLeaveTypesQuery,
  useGetLeaveBalancesQuery,
  useGetLeaveRequestsQuery,
  useGetLeaveRequestQuery,
  useApplyLeaveMutation,
  useCancelLeaveMutation,
  useApproveLeaveMutation,
  useRejectLeaveMutation,
  useGetDashboardQuery,
} = leaveApi;
