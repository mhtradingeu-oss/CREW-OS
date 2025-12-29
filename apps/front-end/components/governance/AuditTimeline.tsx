import { cn } from "@/lib/utils";

interface AuditTimelineItem {
  time: string;
  actor: string;
  action: string;
  context?: string;
}

interface AuditTimelineProps {
  items: AuditTimelineItem[];
  className?: string;
}

export function AuditTimeline({ items, className }: AuditTimelineProps) {
  return (
    <ol className={cn("relative border-l border-slate-700 pl-4 space-y-6", className)}>
      {items.map((item, idx) => (
        <li key={idx} className="ml-2">
          <div className="absolute -left-2.5 mt-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
          <div className="flex flex-col md:flex-row md:items-center md:gap-2">
            <span className="text-xs text-slate-400 w-16 inline-block">{item.time}</span>
            <span className="font-semibold text-white">{item.actor}</span>
            <span className="text-slate-300">{item.action}</span>
            {item.context && <span className="text-slate-400">{item.context}</span>}
          </div>
        </li>
      ))}
    </ol>
  );
}
