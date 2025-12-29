import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui";

interface RiskIndicatorProps {
  level: "low" | "medium" | "high";
  explanation?: string;
  className?: string;
}

const riskMap = {
  low: { color: "bg-emerald-500", label: "Low" },
  medium: { color: "bg-amber-400", label: "Medium" },
  high: { color: "bg-red-500", label: "High" },
};

export function RiskIndicator({ level, explanation, className }: RiskIndicatorProps) {
  const { color, label } = riskMap[level];
  return (
    <Tooltip content={explanation || `Risk: ${label}`}> 
      <span className={cn("inline-flex items-center gap-1", className)}>
        <span className={cn("inline-block h-3 w-3 rounded-full", color)} aria-label={`Risk: ${label}`}></span>
        <span className="text-xs text-slate-400">{label}</span>
      </span>
    </Tooltip>
  );
}
