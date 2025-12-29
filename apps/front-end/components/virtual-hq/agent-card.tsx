import { Bot, MessageCircle, Mic, Settings2, Signal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type AgentCardProps = {
  name: string;
  scope: string;
  role: string;
  status: "online" | "idle" | "offline";
  onChat?: () => void;
  onVoice?: () => void;
  onSettings?: () => void;
};

const statusColor: Record<AgentCardProps["status"], string> = {
  online: "bg-green-500",
  idle: "bg-amber-400",
  offline: "bg-slate-500",
};

export function AgentCard({ name, scope, role, status, onChat, onVoice, onSettings }: AgentCardProps) {
  return (
    <Card className="border-white/10 bg-slate-950/80 shadow-lg">
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-white/10 bg-slate-900 p-2">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">{name}</CardTitle>
            <p className="text-xs text-muted-foreground">{scope}</p>
          </div>
        </div>
        <Badge variant="outline" className="border-white/20 text-[11px] text-white">
          <span className={`mr-1 inline-block h-2 w-2 rounded-full ${statusColor[status]}`} />
          {status}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-200">{role}</p>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Signal className="h-4 w-4" />
          AI ready
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={onChat}>
            <MessageCircle className="mr-1 h-4 w-4" /> Chat
          </Button>
          <Button size="sm" variant="ghost" onClick={onVoice}>
            <Mic className="mr-1 h-4 w-4" /> Voice
          </Button>
          <Button size="sm" variant="ghost" onClick={onSettings}>
            <Settings2 className="mr-1 h-4 w-4" /> Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
