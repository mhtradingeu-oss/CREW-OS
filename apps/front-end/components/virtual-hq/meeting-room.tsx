import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Mic, Radio, Waves } from "lucide-react";

export type MeetingRoomProps = {
  participants: { name: string; role: string; status: string }[];
  agenda: string[];
  actionItems: string[];
  onStartMeeting: () => void;
};

export function MeetingRoom({ participants, agenda, actionItems, onStartMeeting }: MeetingRoomProps) {
  const [notes, setNotes] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [voiceReady] = useState<boolean>(false);

  const handleSyncNotes = () => {
    if (!notes.trim()) {
      toast.error("Add a quick note before syncing.");
      return;
    }
    const now = new Date().toISOString();
    setLastSyncedAt(now);
    toast.success("Notes synced to meeting log.");
  };

  return (
    <Card className="h-full border-white/10 bg-slate-950/80 shadow-lg">
      <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle className="text-lg">Meeting Room</CardTitle>
          <p className="text-sm text-muted-foreground">AI-first rituals with agenda and action items.</p>
        </div>
        <Button onClick={onStartMeeting}>Start Meeting</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">AI Participants</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {participants.map((p) => (
              <div key={p.name} className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-slate-50">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.role}</p>
                </div>
                <Badge variant="outline" className="border-white/20 text-[11px] text-white">
                  {p.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.2fr,1fr]">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold text-slate-50">Meeting table</p>
            <p className="text-xs text-slate-400">Abstract representation of the table and chairs.</p>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {Array.from({ length: 10 }).map((_, idx) => (
                <div key={idx} className="aspect-square rounded-full border border-white/10 bg-slate-800/70 shadow-inner" />
              ))}
              <div className="col-span-5 h-10 rounded-xl border border-dashed border-white/20 bg-slate-800/70" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-50">Live notes</p>
                  {lastSyncedAt ? (
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-slate-200">
                      Synced {new Date(lastSyncedAt).toLocaleTimeString()}
                    </span>
                  ) : null}
                </div>
                <Button size="sm" variant="outline" onClick={handleSyncNotes}>
                  Sync notes
                </Button>
              </div>
              <Textarea
                placeholder="Shared AI notes will appear here"
                className="mt-2 min-h-[96px] bg-slate-900/60"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="rounded-xl border border-amber-400/30 bg-amber-500/5 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-amber-200">
                  <Mic className="h-4 w-4" />
                  <p className="text-sm font-semibold text-amber-100">Voice mode (placeholder)</p>
                </div>
                <Badge variant="outline" className="border-amber-400/40 text-amber-100">
                  {voiceReady ? "Ready" : "Coming soon"}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-amber-100/80">
                We will route microphone capture to orchestrator IVR once the backend endpoint is wired. Stay in safe mode until then.
              </p>
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-300/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                <Radio className="h-4 w-4" />
                <span>Hands-free prompts will live here. Press-to-talk disabled.</span>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
              <p className="text-sm font-semibold text-slate-50">Agenda</p>
              <ul className="list-disc space-y-1 pl-4 text-sm text-slate-200">
                {agenda.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
              <p className="text-sm font-semibold text-slate-50">Action items</p>
              <ul className="list-disc space-y-1 pl-4 text-sm text-slate-200">
                {actionItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Waves className="h-4 w-4" />
                Meeting actions will sync to automation once orchestrator webhooks are connected.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
