// Top navigation bar with the user's name, unread notification badge, and logout.

import { Link } from "react-router-dom";
import { useAppDispatch } from "../store";
import { logout } from "../store/authSlice";
import { useAuth } from "../hooks/useAuth";
import { useGetUnreadCountQuery } from "../api/notificationApi";
import { useLogoutMutation } from "../api/authApi";
import toast from "react-hot-toast";

export default function Navbar() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { data: unreadData } = useGetUnreadCountQuery(undefined, {
    pollingInterval: 30000, // refresh every 30 seconds
  });
  const [logoutApi] = useLogoutMutation();

  async function handleLogout() {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      try {
        await logoutApi({ refresh: refreshToken }).unwrap();
      } catch {
        // token may already be expired, proceed to clear state anyway
      }
    }
    dispatch(logout());
    toast.success("Logged out.");
  }

  return (
    <header className="flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 py-4 backdrop-blur md:px-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">LeaveFlow</p>
        <h1 className="mt-0.5 text-base font-semibold tracking-tight text-slate-900 md:text-lg">
          Leave Management
        </h1>
      </div>
      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <Link
          to="/notifications"
          aria-label="Notifications"
          className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        >
          <span aria-hidden="true">&#128276;</span>
          {unreadData && unreadData.unread_count > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
              {unreadData.unread_count}
            </span>
          )}
        </Link>
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-800">{user?.full_name}</p>
          <p className="text-xs capitalize text-slate-500">{user?.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
