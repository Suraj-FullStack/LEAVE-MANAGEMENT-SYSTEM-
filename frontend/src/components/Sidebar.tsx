// Left sidebar — navigation links filtered by role.

import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface NavItem {
  to: string;
  label: string;
  roles: string[];
}

const navItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", roles: ["admin", "manager", "employee"] },
  { to: "/leaves", label: "Leave Requests", roles: ["admin", "manager", "employee"] },
  { to: "/leaves/apply", label: "Apply for Leave", roles: ["employee"] },
  { to: "/notifications", label: "Notifications", roles: ["admin", "manager", "employee"] },
  { to: "/admin/users", label: "User Management", roles: ["admin"] },
];

export default function Sidebar() {
  const { user } = useAuth();

  const visibleItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <aside className="app-sidebar w-60 bg-slate-950 text-white flex flex-col">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500 text-sm font-black tracking-wide shadow-lg shadow-blue-950/40">
          LM
        </span>
        <div>
          <p className="font-bold tracking-tight">LeaveFlow</p>
          <p className="text-[11px] text-slate-400">People operations</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-5 space-y-1.5">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Workspace
        </p>
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-500/15 text-blue-200 ring-1 ring-inset ring-blue-400/20"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-role border-t border-white/10 px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Signed in as
        </p>
        <p className="mt-1 text-sm font-medium capitalize text-slate-200">
          {user?.role ?? ""}
        </p>
      </div>
    </aside>
  );
}
