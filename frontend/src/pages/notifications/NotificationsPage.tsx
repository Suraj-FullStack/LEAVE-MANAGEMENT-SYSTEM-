// Notifications page — lists all notifications for the user, with mark-all-read.

import {
  useGetNotificationsQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
} from "../../api/notificationApi";
import LoadingSpinner from "../../components/LoadingSpinner";
import toast from "react-hot-toast";
import ApiError from "../../components/ApiError";
import { getApiErrorMessage } from "../../api/errorMessage";

export default function NotificationsPage() {
  const {
    data: notifications,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetNotificationsQuery();
  const [markRead, { isLoading: markingOne }] = useMarkReadMutation();
  const [markAllRead, { isLoading: markingAll }] = useMarkAllReadMutation();

  async function handleMarkAllRead() {
    try {
      await markAllRead().unwrap();
      toast.success("All notifications marked as read.");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Unable to mark notifications as read."));
    }
  }

  async function handleMarkRead(id: number) {
    try {
      await markRead(id).unwrap();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Unable to mark this notification as read."));
    }
  }

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ApiError error={error} onRetry={() => void refetch()} />;

  const unread = notifications?.filter((n) => !n.is_read).length ?? 0;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Updates</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Notifications
          {unread > 0 && (
            <span className="ml-2 align-middle text-sm font-medium text-rose-600">({unread} unread)</span>
          )}
          </h2>
        </div>
        {unread > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="space-y-2">
        {notifications?.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">You’re all caught up. No notifications yet.</p>
        )}
        {notifications?.map((n) => (
          <div
            key={n.id}
            className={`flex items-start justify-between gap-4 rounded-2xl border bg-white px-5 py-4 shadow-sm ${
              !n.is_read ? "border-blue-200 bg-blue-50/40" : "border-slate-200/80"
            }`}
          >
            <div>
              <p className="text-sm font-medium text-slate-800">{n.message}</p>
              <p className="mt-1 text-xs text-slate-400">
                {new Date(n.created_at).toLocaleString()}
              </p>
            </div>
            {!n.is_read && (
              <button
                onClick={() => void handleMarkRead(n.id)}
                disabled={markingOne}
                className="whitespace-nowrap text-xs font-semibold text-blue-700 hover:underline disabled:opacity-50"
              >
                Mark read
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
