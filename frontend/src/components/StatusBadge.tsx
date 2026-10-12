// Colour-coded badge for leave request statuses.

import { LeaveStatus } from "../types";

const colours: Record<LeaveStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-700",
};

interface Props {
  status: LeaveStatus;
}

export default function StatusBadge({ status }: Props) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colours[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
