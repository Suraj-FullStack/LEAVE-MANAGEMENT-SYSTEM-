// Notification API slice — list, mark read, unread count.

import { baseApi } from "./baseApi";
import { Notification } from "../types";

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<Notification[], void>({
      query: () => "/notifications/",
      providesTags: ["Notification"],
    }),
    getUnreadCount: builder.query<{ unread_count: number }, void>({
      query: () => "/notifications/unread-count/",
      providesTags: ["Notification"],
    }),
    markRead: builder.mutation<Notification, number>({
      query: (id) => ({
        url: `/notifications/${id}/read/`,
        method: "PATCH",
      }),
      invalidatesTags: ["Notification"],
    }),
    markAllRead: builder.mutation<{ detail: string }, void>({
      query: () => ({
        url: "/notifications/mark-all-read/",
        method: "POST",
      }),
      invalidatesTags: ["Notification"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
} = notificationApi;
