import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AgentCard, type AgentCardProps } from "./agent-card.tsx";

export type Agent = AgentCardProps;

export function AITeamBoard({ agents, onChat }: { agents: Agent[]; onChat?: (agent: Agent) => void }) {
  return (
    <Card className="h-full border-white/10 bg-slate-950/80 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">AI Team Board</CardTitle>
        <p className="text-sm text-muted-foreground">Crew status, scope, and quick actions.</p>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {agents.map((agent: typeof agents[number]) => (
          <AgentCard
            key={agent.name}
            {...agent}
            onChat={() => onChat?.(agent)}
            onVoice={agent.onVoice}
            onSettings={agent.onSettings}
          />
        ))}
      </CardContent>
    </Card>
  );
}
