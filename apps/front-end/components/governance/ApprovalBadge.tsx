import { cn } from "@/lib/utils";

interface ApprovalBadgeProps {
  status: "pending" | "approved" | "rejected";
  className?: string;
}

const statusMap = {
  pending: { color: "bg-amber-500 text-white", label: "Pending" },
  approved: { color: "bg-emerald-600 text-white", label: "Approved" },
  rejected: { color: "bg-red-600 text-white", label: "Rejected" },
};

export function ApprovalBadge({ status, className }: ApprovalBadgeProps) {
  const { color, label } = statusMap[status];
  return (
    <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wider", color, className)}>
      {label}
    </span>
  );
}
