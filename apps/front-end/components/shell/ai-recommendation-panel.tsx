import { cn } from "@/lib/utils";

export type AIRecommendationPanelProps = {
  title?: string;
  description?: string;
  items?: string[];
  className?: string;
};

export function AIRecommendationPanel({
  title = "AI Recommendation Dock",
  description = "Future AI insights will surface here once the AI Brain is connected.",
  items = [],
  className,
}: AIRecommendationPanelProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/5 bg-gradient-to-br from-slate-900/70 via-indigo-900/80 to-slate-900/90 p-4 text-sm text-slate-100 shadow-xl",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{title}</p>
        <span className="text-xs text-slate-400">AI Brain · TODO</span>
      </div>
      <p className="mt-2 text-xs text-slate-300">{description}</p>
      <div className="mt-4 space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item} className="rounded-xl border border-white/5 bg-white/5 px-3 py-2">
              {item}
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-400">Awaiting AI prompts and automation SRs.</p>
        )}
      </div>
    </div>
  );
}
