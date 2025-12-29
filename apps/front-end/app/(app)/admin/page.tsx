import type { AiCrewMember } from "@/lib/types/ai";
export default function Page() {
  return <div>V1 Read-Only Placeholder</div>;
}

function AdminAiPanel({
  crew,
  conversation,
  aiInput,
  onAiInputChange,
  onAskAi,
}: {
  crew: AiCrewMember[];
  conversation: AiMessage[];
  aiInput: string;
  onAiInputChange: (value: string) => void;
  onAskAi: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        {crew.map((member) => (
          <div
            key={member.name}
            className="space-y-1 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/60 via-slate-900/40 to-slate-900/90 p-4"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{member.name}</p>
            <p className="text-sm font-semibold text-white">{member.focus}</p>
            <p className="text-xs text-slate-400">{member.insight}</p>
          </div>
        ))}
      </div>
      <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">AI Crew Conversation</p>
        <div className="flex flex-col gap-3 max-h-56 overflow-y-auto">
          {conversation.map((entry) => (
            <div
              key={entry.id}
              className={cn(
                "rounded-2xl border border-white/5 p-3 text-sm",
                entry.role === "user"
                  ? "bg-white/10 text-white"
                  : "bg-slate-950/70 text-slate-200",
              )}
            >
              <p className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-500">
                {entry.role === "user" ? "You" : "AI"}
              </p>
              <p>{entry.message}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <textarea
            value={aiInput}
            onChange={(event) => onAiInputChange(event.target.value)}
            placeholder="Ask AI about governance guardrails, risk, or automations..."
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 p-3 text-sm text-white placeholder:text-slate-500 focus:border-primary"
            rows={3}
          />
          <div className="flex items-center justify-between">
            <Button size="sm" variant="secondary" onClick={onAskAi}>
              Ask AI
            </Button>
            <p className="text-[0.65rem] uppercase tracking-[0.4em] text-slate-500">AI Brain · TODO</p>
          </div>
        </div>
      </div>
    </div>
  );
}
