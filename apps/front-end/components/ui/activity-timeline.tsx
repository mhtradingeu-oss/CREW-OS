import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

export type TimelineItem = {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: ReactNode;
  at: Date;
};

export function ActivityTimeline({ items }: { items: { day: string; events: TimelineItem[] }[] }) {
  if (!items.length) return null;
  return (
    <div className="space-y-6">
      {items.map((group) => (
        <div key={group.day} className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Clock className="h-4 w-4" />
            {group.day}
          </div>
          <div className="relative border-l border-border/70 pl-4">
            {group.events.map((event, idx) => (
              <div
                key={event.id}
                className={cn("flex gap-3", idx < group.events.length - 1 && "mb-4")}
              >
                <div className="mt-1 h-2 w-2 rounded-full bg-primary shadow-sm" />
                <div className="flex-1 rounded-lg border border-border/60 bg-card/60 p-3 shadow-sm">
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span>{event.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {event.at.toLocaleTimeString()}
                    </span>
                  </div>
                  {event.subtitle && (
                    <div className="text-xs text-muted-foreground">{event.subtitle}</div>
                  )}
                  {event.badge}
                  {event.meta && (
                    <div className="mt-1 text-[11px] text-muted-foreground">{event.meta}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
