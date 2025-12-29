"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Command, Compass, Loader2, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
// V1 PLACEHOLDER — EXECUTION DISABLED
// import { fetchAiInsights } from "@/lib/api/ai";
// import { apiErrorMessage } from "@/lib/api/client";

export type ModuleContext =
  | "pricing"
  | "marketing"
  | "crm"
  | "loyalty"
  | "field"
  | "virtual-office"
  | "ai-governance"
  | "ai-hq"
  | "superadmin"
  | "workspace";

export type GlobalAssistantContextValue = {
  openCommandPalette: () => void;
  openAssistant: (prefillPrompt?: string) => void;
  setModuleContext: (context: ModuleContext | null) => void;
  moduleContext: ModuleContext | null;
};

const GlobalAssistantContext = createContext<GlobalAssistantContextValue | undefined>(undefined);

function deriveModuleContext(pathname: string | null): ModuleContext | null {
  if (!pathname) return null;
  if (pathname.startsWith("/commerce")) return "pricing";
  if (pathname.startsWith("/growth/marketing")) return "marketing";
  if (pathname.startsWith("/growth/crm")) return "crm";
  if (pathname.startsWith("/growth/loyalty")) return "loyalty";
  if (pathname.startsWith("/field/")) return "field";
  if (pathname.startsWith("/virtual-hq") || pathname.includes("virtual-office")) return "virtual-office";
  if (pathname.startsWith("/superadmin/ai")) return "ai-governance";
  if (pathname.startsWith("/superadmin")) return "superadmin";
  if (pathname.startsWith("/admin/ai-hq")) return "ai-hq";
  return "workspace";
}

type CommandAction = {
  id: string;
  label: string;
  hint?: string;
  onRun: () => void;
};

export function GlobalAssistantProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [moduleContext, setModuleContext] = useState<ModuleContext | null>(() => deriveModuleContext(pathname));
  const [search, setSearch] = useState("");
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contextKey: ModuleContext = moduleContext ?? "workspace";

  useEffect(() => {
    setModuleContext(deriveModuleContext(pathname));
  }, [pathname]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (isCmdK) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const openCommandPalette = useCallback(() => setPaletteOpen(true), []);
  const openAssistant = useCallback((prefill?: string) => {
    if (prefill) setPrompt(prefill);
    setAssistantOpen(true);
  }, []);

  const navigate = useCallback(
    (href: string) => {
      setPaletteOpen(false);
      router.push(href);
    },
    [router],
  );

  const contextualPrompts = useMemo<Record<ModuleContext, string[]>>(
    () => ({
      pricing: ["Check pricing guardrails for current region", "Summarize competitor deltas and margin impact"],
      marketing: ["Draft a campaign brief for this week", "List SEO topics with highest intent"],
      crm: ["Summarize open tickets and sentiment", "Find leads needing fast follow-up"],
      loyalty: ["Highlight churn-risk cohorts and offers", "Suggest VIP rewards for top decile"],
      field: ["Show field ops priorities", "Flag routes at risk"],
      "virtual-office": ["Prep meeting agenda summary", "Draft action items by department"],
      "ai-governance": ["List recent fallbacks and safety events", "Check model usage anomalies"],
      "ai-hq": ["Summarize autonomy tasks", "List AI HQ pending approvals"],
      superadmin: ["Give tenant health snapshot", "Show AI agent activity spikes"],
      workspace: ["What should I do next?", "Summarize today across all modules"],
    }),
    [],
  );

  const commands = useMemo<CommandAction[]>(() => {
    const items: CommandAction[] = [
      { id: "cmd.ask", label: "Ask Hairo Assistant", hint: "Open drawer", onRun: () => openAssistant() },
      {
        id: "cmd.assistant.module",
        label: `Ask about ${contextKey}`,
        onRun: () => openAssistant(contextualPrompts[contextKey]?.[0] ?? "Help me prioritize today."),
      },
      { id: "nav.dashboard", label: "Go to Dashboard", onRun: () => navigate("/dashboard") },
      { id: "nav.virtual", label: "Go to Virtual HQ", onRun: () => navigate("/virtual-hq") },
      { id: "nav.assistant", label: "Open Assistant page", onRun: () => navigate("/dashboard/assistant") },
      { id: "nav.superadmin", label: "Superadmin Control Plane", onRun: () => navigate("/superadmin") },
      { id: "nav.ai-monitoring", label: "AI Monitoring", onRun: () => navigate("/superadmin/ai-monitoring") },
    ];

    if (contextKey === "pricing") {
      items.push({ id: "pricing.guardrails", label: "Check pricing guardrails", onRun: () => openAssistant("Check pricing guardrails and ROI for my active offers.") });
    }
    if (contextKey === "marketing") {
      items.push({ id: "marketing.campaign", label: "Draft campaign idea", onRun: () => openAssistant("Draft a campaign idea for this week with CTA + channel mix.") });
    }
    if (contextKey === "crm") {
      items.push({ id: "crm.followups", label: "List critical follow-ups", onRun: () => openAssistant("List leads/tickets that need urgent follow-up today.") });
    }
    if (contextKey === "virtual-office") {
      items.push({ id: "vo.agenda", label: "Summarize meeting agenda", onRun: () => openAssistant("Summarize the meeting agenda and risks.") });
    }
    if (contextKey === "ai-governance") {
      items.push({ id: "ai.safety", label: "Surface safety fallbacks", onRun: () => openAssistant("List latest AI fallbacks and safety triggers by tenant.") });
    }

    return items;
  }, [contextKey, navigate, openAssistant, contextualPrompts]);

  const filteredCommands = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [commands, search]);

  const safeModeBanner = (
    <div className="flex items-center gap-2 rounded-md border border-amber-300/50 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
      <StatusBadge tone="warning">Safe mode</StatusBadge>
      Actions are read-only. No auto-apply.
    </div>
  );

  const sendPrompt = async () => {
    if (!prompt.trim()) return;
    try {
      setLoading(true);
      setError(null);
      setResponse(null);
      const res = await fetchAiInsights({ brandName: contextKey, highlights: prompt });
      const reply = (res as any)?.insight ?? (res as any)?.summary ?? JSON.stringify(res);
      setResponse(reply ?? "No response provided.");
    } catch (err) {
      setError(apiErrorMessage(err));
      setResponse("Deterministic fallback: AI assistant offline. Use manual guardrails.");
    } finally {
      setLoading(false);
    }
  };

  const providerValue = useMemo(
    () => ({ openCommandPalette, openAssistant, moduleContext, setModuleContext }),
    [moduleContext, openAssistant, openCommandPalette],
  );

  return (
    <GlobalAssistantContext.Provider value={providerValue}>
      {children}

      <Modal
        open={paletteOpen}
        title="Command Palette"
        onClose={() => setPaletteOpen(false)}
      >
        <div className="space-y-3">
          {safeModeBanner}
          <div className="relative">
            <Input
              autoFocus
              placeholder="Type a command or search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
            <Command className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <span className="absolute right-3 top-2.5 text-[11px] text-muted-foreground">Ctrl/Cmd + K</span>
          </div>
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {filteredCommands.map((cmd: typeof filteredCommands[number]) => (
              <button
                key={cmd.id}
                onClick={() => {
                  cmd.onRun();
                  setPaletteOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-lg border border-border/70 bg-card/60 px-3 py-2 text-left text-sm hover:border-primary/60 hover:bg-primary/5"
              >
                <span className="flex items-center gap-2">
                  <Compass className="h-4 w-4 text-primary" />
                  {cmd.label}
                </span>
                {cmd.hint ? <span className="text-[11px] text-muted-foreground">{cmd.hint}</span> : null}
              </button>
            ))}
            {!filteredCommands.length ? (
              <div className="rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">
                No commands found.
              </div>
            ) : null}
          </div>
        </div>
      </Modal>

      <Drawer
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        title="Ask Hairo Assistant"
        description="Context-aware orchestrator helper (safe mode: read-only)"
        footer={
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <StatusBadge tone="warning">Safe mode</StatusBadge>
              Outputs require human apply.
            </div>
            <Button size="sm" variant="secondary" onClick={() => setAssistantOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          {safeModeBanner}
          <div className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
            Context: {moduleContext ?? "workspace"}. We will not auto-execute actions.
          </div>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              contextualPrompts[contextKey]?.[0] ?? "Ask the assistant about this page..."
            }
            rows={4}
          />
          <div className="flex flex-wrap gap-2 text-xs">
            {(contextualPrompts[contextKey] ?? []).map((p: string) => (
              <Button key={p} size="sm" variant="outline" onClick={() => setPrompt(p)}>
                {p}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={sendPrompt} disabled={loading || !prompt.trim()} className="flex items-center gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              Send to orchestrator
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setResponse(null)}>
              Clear output
            </Button>
          </div>
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          {response ? (
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm leading-relaxed">
              <div className="mb-1 flex items-center gap-2 text-xs uppercase text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                Orchestrator response (read-only)
              </div>
              {response}
            </div>
          ) : null}
        </div>
      </Drawer>
    </GlobalAssistantContext.Provider>
  );
}

export function useGlobalAssistant() {
  const ctx = useContext(GlobalAssistantContext);
  if (!ctx) throw new Error("useGlobalAssistant must be used within GlobalAssistantProvider");
  return ctx;
}
