"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useSalesRep,
  useSalesRepKpis,
  useSalesRepLeads,
  useSalesRepVisits,
} from "@/lib/hooks/use-sales-reps";
import {
  createSalesRepLead,
  createSalesRepVisit,
  getSalesRepAiPlan,
  SalesRepAiPlanDto,
} from "@/lib/api/sales-reps";
import { PageHeader } from "@/components/layout/page-header";
import { PermissionGuard } from "@/components/layout/permission-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { StatusBadge } from "@/components/ui/status-badge";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api/client";
import { runVirtualOfficeMeeting, type VirtualOfficeMeetingSummary } from "@/lib/api/ai-brain";
import { useAuth } from "@/lib/auth/auth-context";

const leadSchema = z.object({
  source: z.string().optional(),
  stage: z.string().optional(),
  status: z.string().optional(),
  score: z.coerce.number().min(0).optional(),
  nextAction: z.string().optional(),
  notes: z.string().optional(),
});

const visitSchema = z.object({
  partnerId: z.string().optional(),
  date: z.string().datetime().optional(),
  purpose: z.string().optional(),
  result: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;
type VisitFormValues = z.infer<typeof visitSchema>;

export default function SalesRepDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { hasPermission, hasAnyPermission } = useAuth();
  const queryClient = useQueryClient();
  const {
    data: rep,
    isLoading: repLoading,
    isError: repError,
    error: repErrorData,
  } = useSalesRep(id);
  const { data: leads, isLoading: leadsLoading } = useSalesRepLeads(id);
  const { data: visits, isLoading: visitsLoading } = useSalesRepVisits(id);
  const { data: kpis, isLoading: kpiLoading } = useSalesRepKpis(id);
  const [isLeadModalOpen, setLeadModalOpen] = useState(false);
  const [isVisitModalOpen, setVisitModalOpen] = useState(false);

  const leadForm = useForm<LeadFormValues>({ resolver: zodResolver(leadSchema) });
  const visitForm = useForm<VisitFormValues>({ resolver: zodResolver(visitSchema) });

  const leadMutation = useMutation({
    mutationFn: (payload: LeadFormValues) => createSalesRepLead(id, payload),
    onSuccess: () => {
      toast.success("Lead logged");
      setLeadModalOpen(false);
      leadForm.reset();
      void queryClient.invalidateQueries({ queryKey: ["sales-reps", id, "leads"] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const visitMutation = useMutation({
    mutationFn: (payload: VisitFormValues) => createSalesRepVisit(id, payload),
    onSuccess: () => {
      toast.success("Visit logged");
      setVisitModalOpen(false);
      visitForm.reset();
      void queryClient.invalidateQueries({ queryKey: ["sales-reps", id, "visits"] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const [aiPlanOpen, setAiPlanOpen] = useState(false);
  const [aiPlanLoading, setAiPlanLoading] = useState(false);
  const [aiPlan, setAiPlan] = useState<SalesRepAiPlanDto | null>(null);
  const [voModalOpen, setVoModalOpen] = useState(false);
  const [voLoading, setVoLoading] = useState(false);
  const [voResult, setVoResult] = useState<VirtualOfficeMeetingSummary | null>(null);
  const [contextNotes, setContextNotes] = useState("");
  const canRunAiPlan = hasPermission("ai:crm");
  const canRunVirtualOffice = hasAnyPermission(["ai:virtual-office", "ai:run"]);

  const copyTemplateBody = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Unable to copy template");
    }
  };

  // TODO: Pipe AI plan recommendations into CRM automation once available.
  const handleAiPlan = async () => {
    if (!rep || !canRunAiPlan) return;
    setAiPlanLoading(true);
    try {
      const plan = await getSalesRepAiPlan(id, {
        brandId: rep.brandId === null ? undefined : rep.brandId,
        scope: "sales",
        notes: contextNotes,
      });
      setAiPlan(plan);
      setAiPlanOpen(true);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setAiPlanLoading(false);
    }
  };

  // TODO: Link Virtual Office action items to automation pipelines when workflow exists.
  const handleVirtualOffice = async () => {
    if (!rep || !canRunVirtualOffice) return;
    setVoLoading(true);
    try {
      const leadContext = (leads?.data ?? []).slice(0, 6).map((lead) => ({
        leadId: lead.id,
        name: lead.source ?? lead.stage ?? "Lead",
        stage: lead.stage,
        status: lead.status,
        score: lead.score,
      }));
      const visitContext = (visits?.data ?? []).slice(0, 5).map((visit) => ({
        visitId: visit.id,
        partnerId: visit.partnerId,
        purpose: visit.purpose,
        result: visit.result,
        date: visit.date,
      }));
      const meeting = await runVirtualOfficeMeeting({
        topic: `Sales rep review – ${rep.code ?? "Rep"}`,
        scope: "sales",
        brandId: rep.brandId === null ? undefined : rep.brandId,
        departments: ["sales", "crm", "finance"],
        agenda: ["Review pipeline health", "Plan next actions"],
        notes: contextNotes || "Sales rep checkpoint requested from workspace.",
        salesRepContext: {
          repId: rep.id,
          leads: leadContext,
          visits: visitContext,
          notes: contextNotes,
        },
      });
      setVoResult(meeting);
      setVoModalOpen(true);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setVoLoading(false);
    }
  };

  if (repLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner className="h-4 w-4" />
        Loading sales rep workspace...
      </div>
    );
  }

  if (repError || !rep) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        Failed to load rep: {repErrorData instanceof Error ? repErrorData.message : "Unknown error"}
      </div>
    );
  }

  const territoryName = rep.territories?.[0]?.territory?.name;
  const leadRows = leads?.data ?? [];
  const visitRows = visits?.data ?? [];

  return (
    <PermissionGuard required="sales-rep:read">
      <div className="space-y-6">
        <PageHeader
          title={rep.code ?? "Sales Rep"}
          description={`Territory: ${territoryName ?? "Unassigned"}`}
          meta={
            <StatusBadge tone={rep.status === "ACTIVE" ? "success" : "warning"}>
              {rep.status ?? "Unknown"}
            </StatusBadge>
          }
        />

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {canRunAiPlan && (
              <Button size="sm" onClick={handleAiPlan} disabled={aiPlanLoading}>
                {aiPlanLoading ? "Pulling plan..." : "AI Plan"}
              </Button>
            )}
            {canRunVirtualOffice && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleVirtualOffice}
                disabled={voLoading}
              >
                {voLoading ? "Loading Virtual Office..." : "Discuss in Virtual Office"}
              </Button>
            )}
          </div>
          <Textarea
            value={contextNotes}
            onChange={(event) => setContextNotes(event.target.value)}
            placeholder="Optional notes (constraints, goals, blockers) for AI/Virtual Office"
            rows={2}
            className="text-sm text-muted-foreground"
          />
          <p className="text-xs text-muted-foreground">
            AI output is assistive only; review before acting.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            { title: "Total leads", value: kpis?.totalLeads ?? "—" },
            { title: "Visits", value: kpis?.totalVisits ?? "—" },
            { title: "Orders", value: kpis?.totalOrders ?? "—" },
            { title: "Revenue", value: kpis ? `€${kpis.totalRevenue.toLocaleString()}` : "—" },
          ].map((metric) => (
            <Card key={metric.title} className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-xs uppercase text-muted-foreground">
                  {metric.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{metric.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="space-y-2 shadow-sm">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                Leads
                <InfoTooltip content="Log field leads and capture status for pipeline tracking. AI suggestions will arrive in later phases." />
              </CardTitle>
              {hasPermission("sales-rep:manage") && (
                <Button size="sm" onClick={() => setLeadModalOpen(true)}>
                  Add lead
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {leadsLoading ? (
                <Spinner className="h-4 w-4" />
              ) : leadRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No leads yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stage</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leadRows.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell>{lead.stage ?? "—"}</TableCell>
                        <TableCell>
                          <StatusBadge tone={lead.status === "OPEN" ? "info" : "warning"}>
                            {lead.status}
                          </StatusBadge>
                        </TableCell>
                        <TableCell>{lead.source ?? "—"}</TableCell>
                        <TableCell>{lead.score ?? "—"}</TableCell>
                        <TableCell>{new Date(lead.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          <Card className="space-y-2 shadow-sm">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                Visits
                <InfoTooltip content="Capture field visits and outcomes for the Virtual Office and CRM." />
              </CardTitle>
              {hasPermission("sales-rep:manage") && (
                <Button size="sm" onClick={() => setVisitModalOpen(true)}>
                  Log visit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {visitsLoading ? (
                <Spinner className="h-4 w-4" />
              ) : visitRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No visits logged yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Partner</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visitRows.map((visit) => (
                      <TableRow key={visit.id}>
                        <TableCell>{visit.partnerId ?? "—"}</TableCell>
                        <TableCell>
                          {visit.date ? new Date(visit.date).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell>{visit.purpose ?? "—"}</TableCell>
                        <TableCell>{visit.result ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <Modal open={isLeadModalOpen} title="Add lead" onClose={() => setLeadModalOpen(false)}>
          <Form {...leadForm}>
            <form
              onSubmit={leadForm.handleSubmit((values) => {
                leadMutation.mutate(values);
              })}
              className="space-y-4"
            >
              <FormField
                control={leadForm.control}
                name="stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stage</FormLabel>
                    <FormControl>
                      <Input placeholder="Qualification, proposal, etc." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={leadForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select {...field}>
                        <option value="">Select status</option>
                        <option value="OPEN">Open</option>
                        <option value="FOLLOW_UP">Follow up</option>
                        <option value="LOST">Lost</option>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={leadForm.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <FormControl>
                      <Input placeholder="Channel or referral" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={leadForm.control}
                name="score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Score</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={leadForm.control}
                name="nextAction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next action</FormLabel>
                    <FormControl>
                      <Input placeholder="Follow-up plan" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={leadForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setLeadModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={leadMutation.isLoading}>
                  {leadMutation.isLoading ? "Saving..." : "Add lead"}
                </Button>
              </div>
            </form>
          </Form>
        </Modal>

        <Modal open={isVisitModalOpen} title="Log visit" onClose={() => setVisitModalOpen(false)}>
          <Form {...visitForm}>
            <form
              onSubmit={visitForm.handleSubmit((values) => visitMutation.mutate(values))}
              className="space-y-4"
            >
              <FormField
                control={visitForm.control}
                name="partnerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partner</FormLabel>
                    <FormControl>
                      <Input placeholder="Partner or location ID" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={visitForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={visitForm.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purpose</FormLabel>
                    <FormControl>
                      <Input placeholder="Product demo, refill, etc." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={visitForm.control}
                name="result"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Result</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setVisitModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={visitMutation.isLoading}>
                  {visitMutation.isLoading ? "Saving..." : "Log visit"}
                </Button>
              </div>
            </form>
          </Form>
        </Modal>
        <Modal open={aiPlanOpen} title="AI Plan" onClose={() => setAiPlanOpen(false)}>
          <div className="space-y-4 text-sm">
            <p className="text-xs text-muted-foreground">
              AI suggestion, not final. Review before applying.
            </p>
            <div>
              <p className="font-semibold">Summary</p>
              <p>{aiPlan?.summary ?? "No AI plan generated yet."}</p>
            </div>
            <div>
              <p className="font-semibold text-sm">Prioritized leads</p>
              {aiPlan?.prioritizedLeads.length ? (
                <div className="space-y-2">
                  {aiPlan.prioritizedLeads.map((lead) => (
                    <div key={lead.leadId} className="rounded-md border border-border p-2">
                      <p className="font-medium text-sm">{lead.name ?? lead.leadId}</p>
                      <p className="text-[11px] uppercase text-muted-foreground">
                        {lead.stage ?? "Stage unknown"} · Score {lead.score ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">{lead.reason}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No prioritized leads yet.</p>
              )}
            </div>
            <div>
              <p className="font-semibold text-sm">Suggested actions</p>
              {aiPlan?.suggestedActions.length ? (
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {aiPlan.suggestedActions.map((action, index) => (
                    <li key={`${action.description}-${index}`}>
                      <span className="font-semibold uppercase">{action.type}</span> –{" "}
                      {action.description}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">No actions suggested yet.</p>
              )}
            </div>
            <div>
              <p className="font-semibold text-sm">Email templates</p>
              {aiPlan?.emailTemplates?.length ? (
                <div className="space-y-3">
                  {aiPlan.emailTemplates.map((template) => (
                    <div
                      key={template.subject}
                      className="space-y-2 rounded-md border border-border p-2"
                    >
                      <p className="text-[11px] text-muted-foreground">
                        {template.leadId ? `Lead ${template.leadId}` : "General"}
                      </p>
                      <p className="font-medium">{template.subject}</p>
                      <div className="flex gap-2">
                        <Textarea value={template.body} readOnly rows={3} className="text-xs" />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyTemplateBody(template.body)}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No email templates available yet.</p>
              )}
            </div>
          </div>
        </Modal>
        <Modal
          open={voModalOpen}
          title="Virtual Office summary"
          onClose={() => setVoModalOpen(false)}
        >
          <div className="space-y-4 text-sm">
            <p className="text-xs text-muted-foreground">
              AI suggestion, not final. Review before applying.
            </p>
            {voResult ? (
              <>
                <div>
                  <p className="font-semibold">Summary</p>
                  <p>{voResult.summary}</p>
                </div>
                {voResult.actionItems.length > 0 && (
                  <div>
                    <p className="font-semibold text-sm">Action items</p>
                    <ul className="space-y-2 text-xs text-muted-foreground">
                      {voResult.actionItems.map((item, index) => (
                        <li
                          key={`${item.task}-${index}`}
                          className="rounded-md border border-border p-2"
                        >
                          <p className="font-medium">{item.task}</p>
                          <p className="text-[10px] uppercase text-muted-foreground">
                            {item.department}
                          </p>
                          {item.dueDate && (
                            <p className="text-[10px] text-muted-foreground">
                              Due {new Date(item.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {voResult.recommendations.length > 0 && (
                  <div>
                    <p className="font-semibold text-sm">Recommendations</p>
                    <ul className="space-y-2 text-xs">
                      {voResult.recommendations.map((rec) => (
                        <li key={rec.headline} className="rounded-md border border-border p-2">
                          <p className="font-medium">{rec.headline}</p>
                          <p className="text-muted-foreground text-xs">{rec.summary}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {voResult.risks?.length && (
                  <div>
                    <p className="font-semibold text-sm">Risks</p>
                    <ul className="list-disc px-4 text-xs text-destructive">
                      {voResult.risks.map((risk) => (
                        <li key={risk}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Run a Virtual Office meeting to see summaries here.
              </p>
            )}
          </div>
        </Modal>
      </div>
    </PermissionGuard>
  );
}
