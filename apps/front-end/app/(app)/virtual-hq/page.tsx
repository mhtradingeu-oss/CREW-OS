"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ModuleScaffold } from "@/components/shell/module-scaffold";
import { PageHeader } from "@/components/shell/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { VirtualOfficeMap, MeetingRoom, AITeamBoard, AIJournal, type Agent } from "@/components/virtual-hq";
import { listAiJournal, type AIJournalEntry } from "@/lib/api/ai";
import { apiErrorMessage } from "@/lib/api/client";

const fallbackJournal: AIJournalEntry[] = [
  {
    id: "j-1",
    title: "Pricing guardrail decision",
    summary: "Hold wholesale delta until landed costs refresh tonight.",
    type: "DECISION",
    createdAt: new Date().toISOString(),
    tags: ["pricing", "finance"],
  },
  {
    id: "j-2",
    title: "AI learning: CRM sequence",
    summary: "SMS follow-up after email #2 lifts reply rate by 8% for spa vertical.",
    type: "LEARNING",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    tags: ["crm", "growth"],
  },
  {
    id: "j-3",
    title: "Insight: Stand refill",
    summary: "Stands 12/18 trending low on refill kits; route field ops in next 4h.",
    type: "INSIGHT",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    tags: ["field", "inventory"],
  },
];

const agents: Agent[] = [
  {
    name: "Atlas",
    scope: "Pricing & Revenue",
    role: "Maintains guardrails, drafts AI pricing suggestions, syncs finance",
    status: "online",
  },
  {
    name: "Nova",
    scope: "Growth & Marketing",
    role: "Campaign co-pilot, creative QA, ROAS guardrails",
    status: "online",
  },
  {
    name: "Pulse",
    scope: "CRM & Support",
    role: "Lead scoring, triage, SLA watcher",
    status: "idle",
  },
  {
    name: "Forge",
    scope: "Automation & Ops",
    role: "Workflow orchestrator, incident responder, playbook keeper",
    status: "online",
  },
];

export default function VirtualHqPage() {
  const [aiOpen, setAiOpen] = useState(false);
  const [askInput, setAskInput] = useState("");
  const [sending, setSending] = useState(false);
  const journalQuery = useQuery({ queryKey: ["ai", "journal"], queryFn: () => listAiJournal() });

  const journalEntries = useMemo(() => {
    if (journalQuery.isError) return fallbackJournal;
    if (journalQuery.data) return journalQuery.data;
    return [];
  }, [journalQuery.data, journalQuery.isError]);

  const officeZones = [
    { id: "lobby", title: "Main Lobby", description: "Welcome desk + navigation.", status: "Open", accent: "#22c55e" },
    { id: "meeting", title: "Meeting Room", description: "Strategy + rituals.", status: "Live", accent: "#6366f1" },
    { id: "board", title: "AI Team Board", description: "Crew status & actions.", status: "Ready", accent: "#f97316" },
    { id: "journal", title: "Journal Area", description: "Insights & decisions.", status: "Sync", accent: "#06b6d4" },
    { id: "desk", title: "User Desk", description: "Your tasks & prompts.", status: "Idle", accent: "#a855f7" },
  ];

  const meetingAgenda = ["Pricing guardrails", "Growth pipeline", "Support SLA review"];
  const meetingActions = ["Ship pricing draft to finance", "Activate growth SMS follow-up", "Escalate P1 tickets"];

  const handleVoice = () => {
    // Stub for IVR/voice trigger; integrate backend IVR endpoint when available.
    console.info("Voice channel trigger stubbed for IVR endpoint.");
  };

  const enrichedAgents = agents.map((agent) => ({
    ...agent,
    onChat: () => setAiOpen(true),
    onVoice: handleVoice,
    onSettings: () => setAiOpen(true),
  }));

  const handleAskAi = () => {
    const prompt = askInput.trim();
    if (!prompt) {
      toast.error("Add a question for the AI crew first.");
      return;
    }
    setSending(true);
    // Stub submission; replace with real endpoint call when available.
    setTimeout(() => {
      toast.success("Sent to AI crew. They'll post back in Journal & Notes.");
      setSending(false);
      setAiOpen(false);
      setAskInput("");
    }, 350);
  };

  return (
    <ModuleScaffold
      header={{
        title: "Virtual HQ",
        description: "2D office for AI rituals, meetings, and journaled decisions.",
        actions: (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setAiOpen(true)}>
              Ask AI
            </Button>
          </div>
        ),
        breadcrumbs: [{ label: "Virtual HQ" }],
        meta: <Sparkles className="h-4 w-4 text-primary" />,
      }}
    >
      <div className="grid gap-4 xl:grid-cols-[1.2fr,1fr]">
        <VirtualOfficeMap zones={officeZones} />
        <MeetingRoom
          participants={enrichedAgents.map((a) => ({ name: a.name, role: a.scope, status: a.status }))}
          agenda={meetingAgenda}
          actionItems={meetingActions}
          onStartMeeting={() => setAiOpen(true)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr,1fr]">
        <AITeamBoard agents={enrichedAgents} onChat={() => setAiOpen(true)} />
        <AIJournal
          entries={journalEntries}
          isLoading={journalQuery.isLoading || journalQuery.isFetching}
          isError={journalQuery.isError}
          errorMessage={journalQuery.isError ? apiErrorMessage(journalQuery.error) : undefined}
          onRetry={() =>
            toast.promise(journalQuery.refetch(), {
              loading: "Refreshing journal...",
              success: "Journal refreshed",
              error: "Refresh failed",
            })
          }
          showFallback={journalQuery.isError}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Meetings today" value="3" hint="Virtual workspace" />
        <StatCard title="AI cues" value="7" hint="Queued" />
        <StatCard title="Action items" value="14" hint="Pending" />
        <StatCard title="Voice lines" value="IVR stub" hint="Awaiting backend" />
      </div>

      <Modal open={aiOpen} title="AI Assistant" onClose={() => setAiOpen(false)}>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Ask the AI crew about the meeting, routes, or journal entries.
          </p>
          <Textarea
            placeholder="Ask anything about Virtual HQ"
            value={askInput}
            onChange={(e) => setAskInput(e.target.value)}
            disabled={sending}
          />
          {journalQuery.isError ? (
            <p className="text-xs text-red-500">{apiErrorMessage(journalQuery.error)}</p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setAiOpen(false);
                setAskInput("");
              }}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button onClick={handleAskAi} disabled={sending}>
              {sending ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </Modal>
    </ModuleScaffold>
  );
}
