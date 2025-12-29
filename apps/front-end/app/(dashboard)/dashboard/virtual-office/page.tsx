"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PermissionGuard } from "@/components/layout/permission-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { listBrands } from "@/lib/api/brand";
import {
  getAutonomyStatus,
  getAutonomyPending,
  approveAutonomyTask,
  rejectAutonomyTask,
  runAutonomyCycle,
  updateAutonomyConfig,
  type AutonomyStatus,
} from "@/lib/api/ai-hq";
import {
  DepartmentAgentProfile,
  DepartmentScope,
  VirtualOfficeMeetingSummary,
  listVirtualOfficeDepartments,
  runVirtualOfficeMeeting,
} from "@/lib/api/ai-brain";
import { apiErrorMessage } from "@/lib/api/client";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth/auth-context";

type BrandOption = { id: string; name: string };

const SCOPE_OPTIONS = [
  { value: "", label: "Cross-functional" },
  { value: "launch", label: "Product launch" },
  { value: "pricing", label: "Pricing" },
  { value: "crm", label: "CRM" },
  { value: "marketing", label: "Marketing" },
  { value: "inventory", label: "Inventory" },
  { value: "loyalty", label: "Loyalty" },
];

const DEFAULT_DEPARTMENTS: DepartmentAgentProfile[] = [
  {
    key: "marketing",
    name: "Marketing Director",
    charter: "Demand generation and channel orchestration",
    defaultFocus: "Paid + social mix",
  },
  {
    key: "sales",
    name: "Sales Director",
    charter: "Revenue execution and pipeline pace",
    defaultFocus: "Territories + conversion",
  },
  {
    key: "crm",
    name: "CRM Lead",
    charter: "Lifecycle engagement, lead health, and routing",
    defaultFocus: "Segmentation + scoring",
  },
  {
    key: "loyalty",
    name: "Loyalty Lead",
    charter: "Retention, rewards, and VIP motion",
    defaultFocus: "Points burn/earn balance",
  },
  {
    key: "finance",
    name: "Finance Lead",
    charter: "Margin health and cash discipline",
    defaultFocus: "Net revenue and runway",
  },
  {
    key: "inventory",
    name: "Inventory Lead",
    charter: "Stock reliability and replenishment",
    defaultFocus: "Avoid stockouts + dead stock",
  },
  {
    key: "brand",
    name: "Brand Director",
    charter: "Identity, messaging, and promise consistency",
    defaultFocus: "Narrative + positioning",
  },
];

export default function VirtualOfficePage() {
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentAgentProfile[]>(DEFAULT_DEPARTMENTS);
  const [selectedDepartments, setSelectedDepartments] = useState<DepartmentScope[]>([
    "marketing",
    "sales",
    "finance",
  ]);
  const [brandId, setBrandId] = useState<string>("");
  const [scope, setScope] = useState<string>("launch");
  const [topic, setTopic] = useState<string>("Align HAIROTICMEN Q4 launch plan");
  const [notes, setNotes] = useState<string>(
    "Highlight pricing guardrails, funnel health, and inventory constraints.",
  );
  const [agenda, setAgenda] = useState<string>("Goals, risks, and next steps");
  const [loading, setLoading] = useState<boolean>(false);
  const [meeting, setMeeting] = useState<VirtualOfficeMeetingSummary | null>(null);
  const [autonomyStatus, setAutonomyStatus] = useState<AutonomyStatus | null>(null);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [autonomyLoading, setAutonomyLoading] = useState<boolean>(true);
  const { hasPermission } = useAuth();

  const agendaItems = useMemo(
    () =>
      agenda
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    [agenda],
  );

  useEffect(() => {
    void loadBrands();
    void loadDepartments();
    void loadAutonomy();
  }, []);

  const loadAutonomy = async () => {
    try {
      setAutonomyLoading(true);
      const [status, pending] = await Promise.all([getAutonomyStatus(), getAutonomyPending()]);
      setAutonomyStatus(status);
      setPendingTasks(pending ?? []);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setAutonomyLoading(false);
    }
  };

  const loadBrands = async () => {
    try {
      const brandRes = await listBrands({ page: 1, pageSize: 50 });
      setBrands((brandRes?.data ?? []).map((b) => ({ id: b.id, name: b.name })));
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const loadDepartments = async () => {
    try {
      const dept = await listVirtualOfficeDepartments();
      setDepartments(dept);
    } catch (err) {
      toast.error(apiErrorMessage(err));
      setDepartments(DEFAULT_DEPARTMENTS);
    }
  };

  const toggleDepartment = (dept: DepartmentScope) => {
    setSelectedDepartments((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept],
    );
  };

  const startMeeting = async () => {
    if (!topic.trim()) {
      toast.error("Topic is required");
      return;
    }
    if (!selectedDepartments.length) {
      toast.error("Select at least one department");
      return;
    }
    try {
      setLoading(true);
      const payload = {
        topic,
        scope: scope || undefined,
        brandId: brandId || undefined,
        departments: selectedDepartments,
        agenda: agendaItems,
        notes,
      };
      const result = await runVirtualOfficeMeeting(payload);
      setMeeting(result);
      toast.success("Virtual meeting generated");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const toggleKillSwitch = async () => {
    if (!autonomyStatus) return;
    try {
      setAutonomyLoading(true);
      const next = !autonomyStatus.globalAutonomyEnabled;
      await updateAutonomyConfig({ globalAutonomyEnabled: next });
      toast.success(next ? "Autonomy enabled" : "Autonomy disabled");
      await loadAutonomy();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setAutonomyLoading(false);
    }
  };

  const runCycle = async () => {
    try {
      setAutonomyLoading(true);
      const result = await runAutonomyCycle({ autoExecute: true });
      toast.success(`Cycle complete (${result?.planned?.length ?? 0} tasks planned)`);
      await loadAutonomy();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setAutonomyLoading(false);
    }
  };

  const handleApprove = async (taskId: string) => {
    try {
      await approveAutonomyTask(taskId);
      toast.success("Approved");
      await loadAutonomy();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const handleReject = async (taskId: string) => {
    try {
      await rejectAutonomyTask(taskId);
      toast.success("Rejected");
      await loadAutonomy();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <PermissionGuard required={["ai:virtual-office", "ai:run"]}>
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Autonomy mission control</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleKillSwitch}
                disabled={autonomyLoading || !hasPermission("ai:config:update")}
              >
                {autonomyLoading ? <Spinner className="h-4 w-4" /> : autonomyStatus?.globalAutonomyEnabled ? "Disable" : "Enable"}
              </Button>
              <Button
                size="sm"
                onClick={runCycle}
                disabled={autonomyLoading || !hasPermission(["ai:autonomy:manage", "ai:run"])}
              >
                {autonomyLoading ? <Spinner className="h-4 w-4" /> : "Run AI Cycle"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
            <StatusTile label="Status" value={autonomyStatus?.globalAutonomyEnabled ? "ON" : "OFF"} />
            <StatusTile label="Last run" value={autonomyStatus?.lastRunAt ? new Date(autonomyStatus.lastRunAt).toLocaleString() : "-"} />
            <StatusTile label="Pending" value={autonomyStatus?.totalPending ?? 0} />
            <StatusTile label="Executed" value={autonomyStatus?.totalExecuted ?? 0} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Pending autonomy tasks</CardTitle>
            {autonomyLoading && <Spinner className="h-4 w-4" />}
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingTasks.length === 0 ? (
              <div className="text-sm text-muted-foreground">No pending tasks.</div>
            ) : (
              pendingTasks.map((task) => (
                <div key={task.taskId} className="rounded-md border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{task.goal ?? "Autonomy task"}</div>
                    <Badge variant="secondary" className="uppercase">
                      {task.risk ?? ""}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">Engine: {task.engine}</div>
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => void handleApprove(task.taskId)}
                      disabled={!hasPermission(["ai:autonomy:manage", "ai:run"])}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => void handleReject(task.taskId)}
                      disabled={!hasPermission(["ai:autonomy:manage", "ai:run"])}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <PageHeader
          title="Virtual Office"
          description="Spin up an AI-led leadership meeting across departments, grounded in the brand context."
          meta={
            <InfoTooltip content="Orchestrates multi-agent recommendations across marketing, sales, CRM, loyalty, finance, inventory, and brand." />
          }
          actions={
            <Button
              onClick={startMeeting}
              disabled={loading || !hasPermission(["ai:run", "ai:virtual-office"])}
            >
              {loading ? <Spinner className="h-4 w-4" /> : "Start Meeting"}
            </Button>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Setup
              <InfoTooltip content="Pick a brand, set the topic, and select which AI department heads join this session." />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Brand</label>
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                >
                  <option value="">All brands</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Scope</label>
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                >
                  {SCOPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Topic</label>
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="What should the AI leadership align on?"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Departments</label>
              <div className="grid gap-2 md:grid-cols-3">
                {departments.map((dept) => {
                  const active = selectedDepartments.includes(dept.key);
                  return (
                    <button
                      key={dept.key}
                      type="button"
                      onClick={() => toggleDepartment(dept.key)}
                      className={`rounded-lg border px-3 py-2 text-left transition ${active ? "border-primary bg-primary/10 shadow-sm" : "hover:border-primary/50"}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold capitalize">{dept.key}</div>
                        {active ? <Badge variant="secondary">In meeting</Badge> : null}
                      </div>
                      <p className="text-xs text-muted-foreground">{dept.charter}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Notes</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Constraints, blockers, KPI highlights"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Agenda</label>
                <Textarea
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  rows={4}
                  placeholder="One item per line, e.g. Risks, Pricing updates, Inventory health"
                />
                <p className="text-xs text-muted-foreground">
                  Agenda items flow into the AI meeting summary.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Meeting Output</CardTitle>
            {!meeting && <Badge variant="secondary">Awaiting run</Badge>}
          </CardHeader>
          <CardContent className="space-y-4">
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="h-4 w-4" /> Running orchestrator…
              </div>
            )}

            {meeting ? (
              <>
                <div className="space-y-1 rounded-lg border bg-muted/30 p-3">
                  <div className="text-xs uppercase text-muted-foreground">Summary</div>
                  <div className="text-sm leading-relaxed">{meeting.summary}</div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold uppercase text-muted-foreground">
                        Agenda
                      </h3>
                      <InfoTooltip content="AI maps your agenda into outcomes and next steps." />
                    </div>
                    {meeting.agenda?.length ? (
                      <ul className="space-y-2 text-sm">
                        {meeting.agenda.map((item, idx) => (
                          <li key={idx} className="rounded-lg border p-2">
                            <div className="font-medium">{item.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.desiredOutcome}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-sm text-muted-foreground">No agenda captured.</div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold uppercase text-muted-foreground">
                        Risks
                      </h3>
                      <InfoTooltip content="Execution or data risks surfaced by the AI meeting." />
                    </div>
                    {meeting.risks?.length ? (
                      <ul className="space-y-2 text-sm">
                        {meeting.risks.map((risk, idx) => (
                          <li
                            key={idx}
                            className="rounded-lg border border-destructive/30 bg-destructive/5 p-2"
                          >
                            {risk}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-sm text-muted-foreground">No risks flagged.</div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold uppercase text-muted-foreground">
                      Recommendations
                    </h3>
                    <InfoTooltip content="Department-level directives with action items." />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {meeting.recommendations.map((rec) => (
                      <div key={rec.department + rec.headline} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold capitalize">{rec.department}</div>
                          <Badge variant="outline">Owner: AI {rec.department}</Badge>
                        </div>
                        <div className="text-sm font-medium">{rec.headline}</div>
                        <p className="text-sm text-muted-foreground">{rec.summary}</p>
                        {rec.actionItems?.length ? (
                          <ul className="mt-2 space-y-2 text-sm">
                            {rec.actionItems.map((item, idx) => (
                              <li key={idx} className="rounded-md bg-muted/30 p-2">
                                <div className="font-medium">{item.task}</div>
                                <div className="text-xs text-muted-foreground">
                                  {item.owner ?? "Unassigned"}{" "}
                                  {item.dueDate
                                    ? ` • Due ${new Date(item.dueDate).toLocaleDateString()}`
                                    : ""}
                                  {item.impact ? ` • Impact: ${item.impact}` : ""}
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold uppercase text-muted-foreground">
                      Action Items
                    </h3>
                    <InfoTooltip content="Cross-functional tasks routed to departments; plug into Automations next." />
                  </div>
                  {meeting.actionItems?.length ? (
                    <div className="grid gap-2 md:grid-cols-2">
                      {meeting.actionItems.map((item, idx) => (
                        <div key={idx} className="rounded-lg border p-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold capitalize">
                              {item.department}
                            </span>
                            {item.dueDate ? (
                              <Badge variant="outline">
                                Due {new Date(item.dueDate).toLocaleDateString()}
                              </Badge>
                            ) : null}
                          </div>
                          <div className="text-sm">{item.task}</div>
                          <div className="text-xs text-muted-foreground">
                            Owner: {item.owner ?? "Unassigned"}{" "}
                            {item.impact ? ` • Impact: ${item.impact}` : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No action items returned.</div>
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Configure your meeting and start the orchestrator to see the AI summary.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}

function StatusTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border p-2">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
