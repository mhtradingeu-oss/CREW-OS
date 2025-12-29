import { ModuleScaffold } from "@/components/shell/module-scaffold";
import { PageHeader } from "@/components/shell/page-header";
import { AiPanel } from "@/components/ui/ai-panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { aiAgents } from "@/lib/superadmin/mock-data";

export default function SuperAdminAiAgentsPage() {
  return (
    <ModuleScaffold
      header={{
        title: "AI Agents & Autonomy",
        description: "Manifest of registered agents and guardrails (read-only)",
        breadcrumbs: [{ label: "Super Admin" }, { label: "AI Agents" }],
      }}
    >
      <PageHeader
        title="AI Agents"
        description="Scope, autonomy, allowed actions, restricted domains"
        meta={<StatusBadge tone="info">Read-only</StatusBadge>}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {aiAgents.map((agent) => (
          <AiPanel
            key={agent.id}
            title={agent.name}
            description={agent.description}
            hint={`Scope: ${agent.scope}`}
          >
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <StatusBadge tone="info">{agent.scope}</StatusBadge>
              <StatusBadge tone={agent.autonomyLevel === "autonomous" ? "warning" : "success"}>
                {agent.autonomyLevel}
              </StatusBadge>
              <StatusBadge tone="default">Budget: ${agent.budgetProfile.perRunUsd.toFixed(2)} / run</StatusBadge>
            </div>
            <div className="mt-2 text-sm">
              <div className="font-semibold">Allowed actions</div>
              <p className="text-muted-foreground">{agent.allowedActions.join(", ")}</p>
            </div>
            <div className="text-sm">
              <div className="font-semibold">Restricted domains</div>
              <p className="text-muted-foreground">{agent.restrictedDomains.join(", ")}</p>
            </div>
          </AiPanel>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Controls are read-only unless backend exposes safe mutation endpoints.</p>
    </ModuleScaffold>
  );
}
