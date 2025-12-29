"use client";

import { useCallback, useEffect, useState } from "react";
import { listBrands } from "@/lib/api/brand";
import {
  listAgentConfigs,
  updateAgentConfig,
  type AgentConfigOverride,
} from "@/lib/api/ai-hq";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api/client";
import { PermissionGuard } from "@/components/layout/permission-guard";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth/auth-context";

const AUTONOMY_LEVELS = [
  { value: "AUTO_DISABLED", label: "Suggest-only" },
  { value: "AUTO_LOW_RISK_ONLY", label: "Auto (low risk)" },
  { value: "AUTO_FULL", label: "Full autonomy" },
] as const;

const RISK_LEVELS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
] as const;

type AgentConfig = {
  agentId: string;
  label: string;
  scope: string;
  capabilities: string[];
  defaultContexts: string[];
  autonomyLevel: "AUTO_DISABLED" | "AUTO_LOW_RISK_ONLY" | "AUTO_FULL";
  defaultAutonomyLevel: "AUTO_DISABLED" | "AUTO_LOW_RISK_ONLY" | "AUTO_FULL";
  maxRiskLevel: "low" | "medium" | "high";
  enabledContexts: string[];
  notes?: string;
  safety?: { permissions: string[]; brandScoped?: boolean; tenantScoped?: boolean; blockedTopics?: string[] };
};

export default function AIAgentsPage() {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [brandId, setBrandId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const { user } = useAuth();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [agentRes, brandRes] = await Promise.all([
        listAgentConfigs(brandId ? { brandId } : undefined),
        listBrands(),
      ]);
      setAgents(agentRes as AgentConfig[]);
      setBrands(brandRes?.data ?? []);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    void load();
  }, [load]);

  const applyUpdate = async (agentId: string, patch: AgentConfigOverride) => {
    try {
      setSavingId(agentId);
      await updateAgentConfig(agentId, { ...patch, brandId: brandId || undefined });
      toast.success("Saved");
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSavingId(null);
    }
  };

  const toggleContext = (agent: AgentConfig, context: string) => {
    const nextContexts = agent.enabledContexts.includes(context)
      ? agent.enabledContexts.filter((c) => c !== context)
      : [...agent.enabledContexts, context];
    void applyUpdate(agent.agentId, { enabledContexts: nextContexts });
  };

  return (
    <PermissionGuard required={["ai:config:read", "ai:manage"]}>
      <div className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold">AI Agents & Autonomy</h1>
            <p className="text-sm text-muted-foreground">
              View manifest-defined agents and control autonomy levels, contexts, and safety notes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="rounded-md border px-3 py-2 text-sm"
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
            >
              <option value="">All brands</option>
              {brands.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={load} disabled={loading}>
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4" /> Loading agents…
          </div>
        ) : agents.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            No agents found in manifest.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {agents.map((agent) => (
              <Card key={agent.agentId}>
                <CardHeader className="space-y-1">
                  <div className="flex items-center justify-between">
                    <CardTitle>{agent.label}</CardTitle>
                    <Badge variant="outline" className="uppercase">
                      {agent.scope}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{agent.agentId}</div>
                  <div className="text-xs text-muted-foreground">
                    {agent.capabilities.join(" • ")}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Autonomy level</Label>
                      <select
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        value={agent.autonomyLevel}
                        onChange={(e) =>
                          void applyUpdate(agent.agentId, {
                            autonomyLevel: e.target.value as AgentConfigOverride["autonomyLevel"],
                          })
                        }
                        disabled={savingId === agent.agentId}
                      >
                        {AUTONOMY_LEVELS.map((opt) => (
                          <option
                            key={opt.value}
                            value={opt.value}
                            disabled={opt.value === "AUTO_FULL" && user?.role !== "SUPER_ADMIN"}
                          >
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label>Max risk level</Label>
                      <select
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        value={agent.maxRiskLevel}
                        onChange={(e) =>
                          void applyUpdate(agent.agentId, {
                            maxRiskLevel: e.target.value as AgentConfigOverride["maxRiskLevel"],
                          })
                        }
                        disabled={savingId === agent.agentId}
                      >
                        {RISK_LEVELS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label>Enabled contexts</Label>
                    <div className="flex flex-wrap gap-2">
                      {agent.defaultContexts.map((ctx) => {
                        const enabled = agent.enabledContexts.includes(ctx);
                        return (
                          <button
                            key={ctx}
                            type="button"
                            onClick={() => toggleContext(agent, ctx)}
                            className={`rounded-full border px-3 py-1 text-xs ${enabled ? "border-primary bg-primary/10" : "hover:border-primary/40"}`}
                            disabled={savingId === agent.agentId}
                          >
                            {ctx}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label>Notes</Label>
                    <Textarea
                      rows={3}
                      value={agent.notes ?? ""}
                      onChange={(e) =>
                        void applyUpdate(agent.agentId, {
                          notes: e.target.value,
                        })
                      }
                      placeholder="Safety notes or operator warnings"
                      disabled={savingId === agent.agentId}
                    />
                  </div>

                  {agent.safety ? (
                    <div className="space-y-1 rounded-md border p-2 text-xs text-muted-foreground">
                      <div className="font-semibold text-foreground">Safety</div>
                      <div>Permissions: {agent.safety.permissions.join(", ")}</div>
                      {agent.safety.blockedTopics?.length ? (
                        <div>Blocked topics: {agent.safety.blockedTopics.join(", ")}</div>
                      ) : null}
                    </div>
                  ) : null}

                  {savingId === agent.agentId ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Spinner className="h-3 w-3" /> Saving…
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
