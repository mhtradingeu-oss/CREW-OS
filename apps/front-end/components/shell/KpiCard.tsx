import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  status?: "success" | "info" | "warning" | "danger";
  badge?: string;
  className?: string;
}

const statusColors = {
  success: "bg-emerald-600 text-white",
  info: "bg-blue-600 text-white",
  warning: "bg-amber-500 text-white",
  danger: "bg-red-600 text-white",
};

export default function KpiCard({ label, value, status, badge, className }: KpiCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow flex flex-col gap-2 min-h-[120px] group hover:bg-slate-800 transition-colors duration-150",
        className
      )}
      tabIndex={0}
      aria-label={label + ": " + value}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-slate-400">{label}</span>
        {badge && (
          <span className={cn("ml-2 rounded px-2 py-0.5 text-xs font-semibold", status ? statusColors[status] : "bg-slate-700 text-white")}>{badge}</span>
        )}
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
    </div>
  );
}
