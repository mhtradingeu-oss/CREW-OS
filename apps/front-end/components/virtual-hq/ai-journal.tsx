import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AIJournalEntry } from "@/lib/api/ai";

type Props = {
  entries: AIJournalEntry[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  showFallback?: boolean;
};

export function AIJournal({ entries, isLoading, isError, errorMessage, onRetry, showFallback }: Props) {
  const typeBadge: Record<AIJournalEntry["type"], string> = {
    INSIGHT: "bg-indigo-500/20 text-indigo-100",
    LEARNING: "bg-emerald-500/20 text-emerald-100",
    DECISION: "bg-amber-500/20 text-amber-100",
  };

  const skeletonRows = Array.from({ length: 3 });

  return (
    <Card className="h-full border-white/10 bg-slate-950/80 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">AI Journal</CardTitle>
        <p className="text-sm text-muted-foreground">Notion-style timeline of insights, learnings, and decisions.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isError ? (
          <div className="flex items-start justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-200">
            <div>
              <p className="font-semibold">Could not load AI journal</p>
              <p className="text-red-200/90">{errorMessage ?? "Unexpected error."}</p>
              {showFallback ? <p className="mt-1 text-xs text-red-200/80">Showing cached fallback entries.</p> : null}
            </div>
            {onRetry ? (
              <Button size="sm" variant="outline" className="border-red-500/40 text-red-100" onClick={onRetry}>
                Retry
              </Button>
            ) : null}
          </div>
        ) : null}

        {isLoading && !entries.length
          ? skeletonRows.map((_, idx) => (
              <div key={idx} className="animate-pulse rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-24 rounded bg-white/10" />
                  <div className="h-4 w-32 rounded bg-white/10" />
                </div>
                <div className="mt-3 h-4 w-40 rounded bg-white/10" />
                <div className="mt-2 h-4 w-full rounded bg-white/10" />
              </div>
            ))
          : null}

        {!entries.length && !isLoading && !isError ? (
          <p className="text-sm text-muted-foreground">No journal entries yet.</p>
        ) : null}

        {entries.map((entry) => (
          <div key={entry.id} className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Badge className={typeBadge[entry.type]}>{entry.type}</Badge>
                <span>{new Date(entry.createdAt).toLocaleString()}</span>
              </div>
              {entry.tags && entry.tags.length ? (
                <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
                  {entry.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="border-white/20 text-[11px] text-white">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-50">{entry.title}</p>
            <p className="text-sm text-slate-200">{entry.summary}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
