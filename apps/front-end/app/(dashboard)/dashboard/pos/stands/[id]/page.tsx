"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Control, FieldValues, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useStand, useStandPerformance } from "@/lib/hooks/use-stand-pos";
import {
  createStandRefill,
  getStandAiStockSuggestion,
  StandAiStockSuggestionDto,
  StandRefillInputDto,
} from "@/lib/api/stand-pos";
import { PageHeader } from "@/components/layout/page-header";
import { PermissionGuard } from "@/components/layout/permission-guard";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  LineChart,
  Line as RechartLine,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { apiErrorMessage } from "@/lib/api/client";
import { runVirtualOfficeMeeting, type VirtualOfficeMeetingSummary } from "@/lib/api/ai-brain";
import { useAuth } from "@/lib/auth/auth-context";

const refillSchema = z.object({
  standLocationId: z.string().min(1, "Select a location"),
  productId: z.string().min(1, "Select a product"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  expectedAt: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
});

type RefillFormValues = z.infer<typeof refillSchema>;

export default function StandDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { hasPermission, hasAnyPermission } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<StandAiStockSuggestionDto | null>(null);
  const [voModalOpen, setVoModalOpen] = useState(false);
  const [voLoading, setVoLoading] = useState(false);
  const [voResult, setVoResult] = useState<VirtualOfficeMeetingSummary | null>(null);
  const [contextNotes, setContextNotes] = useState("");
  const canRunAiStock = hasPermission("ai:pricing");
  const canRunVirtualOffice = hasAnyPermission(["ai:virtual-office", "ai:run"]);
  // TODO: Route AI suggestions into refill automation drafts when the automation layer is ready.
  const handleAiStock = async () => {
    if (!stand || !canRunAiStock) return;
    setAiLoading(true);
    try {
      const suggestion = await getStandAiStockSuggestion(id, {
        brandId: stand.brandId,
        scope: "inventory",
        notes: contextNotes || `Stand stock check for ${stand.name}`,
      });
      setAiResult(suggestion);
      setAiModalOpen(true);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setAiLoading(false);
    }
  };
  // TODO: Send Virtual Office action items to automation/task manager once workflows exist.
  const handleVirtualOffice = async () => {
    if (!stand || !canRunVirtualOffice) return;
    setVoLoading(true);
    try {
      const inventorySnapshot = stand.locations.flatMap((location) =>
        location.inventories.map((inventory) => ({
          locationId: location.id,
          locationName: location.name,
          productId: inventory.productId,
          sku: inventory.productId,
          name: inventory.productName,
          quantity: inventory.quantity,
          status: inventory.status,
          lastRefillAt: inventory.lastRefillAt,
        })),
      );
      const products = stand.locations.flatMap((location) =>
        location.inventories.map((inventory) => ({
          productId: inventory.productId,
          sku: inventory.productId,
          name: inventory.productName,
          currentQty: inventory.quantity,
          location: location.name,
        })),
      );
      const meeting = await runVirtualOfficeMeeting({
        topic: `Stand review – ${stand.name}`,
        scope: "inventory",
        brandId: stand.brandId,
        departments: ["inventory", "finance", "sales"],
        agenda: ["Review refill plan", "Validate loyalty performance"],
        notes: contextNotes || "Stand review requested from POS workspace.",
        standContext: {
          standId: stand.id,
          products,
          inventorySnapshot,
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
  const { data: stand, isLoading, isError, error } = useStand(id);
  const { data: performance, isLoading: performanceLoading } = useStandPerformance(id);

  const form = useForm<RefillFormValues>({
    resolver: zodResolver(refillSchema),
    defaultValues: { quantity: 1 },
  });

  const refillControl = form.control as unknown as Control<FieldValues>;

  const refillMutation = useMutation({
    mutationFn: (payload: StandRefillInputDto) => createStandRefill(id, payload),
    onSuccess: () => {
      toast.success("Refill recorded");
      setIsModalOpen(false);
      form.reset({ quantity: 1 });
      void queryClient.invalidateQueries({ queryKey: ["stand-pos", "stand", id] });
      void queryClient.invalidateQueries({ queryKey: ["stand-pos", "stand-performance", id] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const inventoryOptions = useMemo(() => {
    if (!stand) return [];
    return stand.locations
      .flatMap((location) =>
        location.inventories.map((record) => ({
          value: record.productId,
          label: `${record.productName ?? record.productId} @ ${location.name}`,
          locationId: location.id,
        })),
      )
      .filter(
        (item, index, self) => index === self.findIndex((match) => match.value === item.value),
      );
  }, [stand]);

  const chartData = useMemo(() => {
    if (!performance) return [];
    return [
      { name: "Orders", value: performance.totalOrders },
      { name: "Pending refills", value: performance.refillOrdersPending },
    ];
  }, [performance]);

  const statusTone = stand?.status === "ACTIVE" ? "success" : "warning";

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner className="h-4 w-4" />
        Loading stand details...
      </div>
    );
  }

  if (isError || !stand) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        Failed to load stand: {error instanceof Error ? error.message : "Unknown error"}
      </div>
    );
  }

  return (
    <PermissionGuard required="pos:read">
      <div className="space-y-6">
        <PageHeader
          title={stand.name}
          description="Manage inventory, refills, and performance for this stand."
          meta={<StatusBadge tone={statusTone}>{stand.status}</StatusBadge>}
        />

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Stand meta
                <InfoTooltip content="Partner, location, and package information for the stand." />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">
                Partner:
                <span className="ml-1">{stand.partner?.name ?? "N/A"}</span>
              </p>
              <p>Locations: {stand.locationCount}</p>
              <p>Type: {stand.standType ?? "—"}</p>
              <p>
                Last refill:
                <span className="ml-1">
                  {performance?.lastRefillAt
                    ? new Date(performance.lastRefillAt).toLocaleString()
                    : "—"}
                </span>
              </p>
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex flex-wrap gap-2">
                  {hasPermission("pos:manage") && (
                    <Button size="sm" onClick={() => setIsModalOpen(true)}>
                      Register refill
                    </Button>
                  )}
                  {canRunAiStock && (
                    <Button size="sm" onClick={handleAiStock} disabled={aiLoading}>
                      {aiLoading ? "Thinking..." : "AI Stock Suggestions"}
                    </Button>
                  )}
                  {canRunVirtualOffice && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleVirtualOffice}
                      disabled={voLoading}
                    >
                      {voLoading ? "Calling Virtual Office..." : "Open in Virtual Office"}
                    </Button>
                  )}
                </div>
                <Textarea
                  value={contextNotes}
                  onChange={(event) => setContextNotes(event.target.value)}
                  placeholder="Optional notes for AI / Virtual Office (constraints, goals, blockers)"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  AI suggestion, not final. Review before applying.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Inventory {stand.locationCount ? `(${stand.locationCount} locations)` : ""}
                <InfoTooltip content="Current stock per product per location. Stock-outs show a warning badge." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stand.locations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No inventory captured yet.</p>
              ) : (
                stand.locations.map((location) => (
                  <div key={location.id} className="mb-4 last:mb-0">
                    <div className="text-sm font-semibold">{location.name}</div>
                    <Table className="mt-2">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Last refill</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {location.inventories.map((record) => (
                          <TableRow key={record.productId}>
                            <TableCell>{record.productName ?? record.productId}</TableCell>
                            <TableCell>
                              {record.quantity <= 0 ? (
                                <StatusBadge tone="danger">Stock-out</StatusBadge>
                              ) : (
                                <StatusBadge tone="success">Healthy</StatusBadge>
                              )}
                            </TableCell>
                            <TableCell>{record.quantity}</TableCell>
                            <TableCell>
                              {record.lastRefillAt
                                ? new Date(record.lastRefillAt).toLocaleString()
                                : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Performance
                <InfoTooltip content="KPIs generated from the stand performance service. Series will expand in future releases." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {performanceLoading ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <div className="h-48">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <RechartLine
                          type="monotone"
                          dataKey="value"
                          stroke="#2563eb"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Performance details are pending.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Modal open={isModalOpen} title="Register refill" onClose={() => setIsModalOpen(false)}>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => {
                refillMutation.mutate({
                  standLocationId: values.standLocationId,
                  expectedAt: values.expectedAt,
                  source: values.source,
                  notes: values.notes,
                  items: [
                    {
                      productId: values.productId,
                      quantity: values.quantity,
                      refillSource: values.source,
                    },
                  ],
                });
              })}
              className="space-y-4"
            >
              <FormField
                control={refillControl}
                name="standLocationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Select {...field}>
                        <option value="">Select location</option>
                        {stand.locations.map((location) => (
                          <option key={location.id} value={location.id}>
                            {location.name}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormMessage name="standLocationId" />
                  </FormItem>
                )}
              />
              <FormField
                control={refillControl}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product</FormLabel>
                    <FormControl>
                      <Select {...field}>
                        <option value="">Select product</option>
                        {inventoryOptions.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormMessage name="productId" />
                  </FormItem>
                )}
              />
              <FormField
                control={refillControl}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage name="quantity" />
                  </FormItem>
                )}
              />
              <FormField
                control={refillControl}
                name="expectedAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected arrival</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={refillControl}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <FormControl>
                      <Input placeholder="Manual request, automation, etc." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={refillControl}
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
                <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={refillMutation.isLoading}>
                  {refillMutation.isLoading ? "Saving..." : "Save refill"}
                </Button>
              </div>
            </form>
          </Form>
        </Modal>
        <Modal
          open={aiModalOpen}
          title="AI Stock Suggestions"
          onClose={() => setAiModalOpen(false)}
        >
          <div className="space-y-4 text-sm">
            <p className="text-xs text-muted-foreground">
              AI suggestion, not final. Review before applying.
            </p>
            <div>
              <p className="text-sm font-semibold">Summary</p>
              <p>{aiResult?.summary ?? "No insights generated yet."}</p>
            </div>
            <div>
              <p className="text-sm font-semibold">Low-stock SKUs</p>
              {aiResult?.lowStock?.length ? (
                <Table className="mt-2 text-xs">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Suggested</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aiResult.lowStock.map((item) => (
                      <TableRow key={item.productId}>
                        <TableCell>{item.name ?? item.productId}</TableCell>
                        <TableCell>{item.currentQty}</TableCell>
                        <TableCell>{item.suggestedQty}</TableCell>
                        <TableCell>{item.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-xs text-muted-foreground">No low-stock alerts right now.</p>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold">Slow mover ideas</p>
              {aiResult?.slowMovers?.length ? (
                <div className="space-y-2">
                  {aiResult.slowMovers.map((item) => (
                    <div key={item.productId} className="rounded-md border border-border p-3">
                      <p className="font-medium">{item.name ?? item.productId}</p>
                      <p className="text-xs text-muted-foreground">{item.suggestion}</p>
                      {item.campaignIdea && (
                        <p className="text-xs italic text-muted-foreground">{item.campaignIdea}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No slow-mover ideas surfaced yet.</p>
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
                  <p className="text-sm font-semibold">Summary</p>
                  <p>{voResult.summary}</p>
                </div>
                {voResult.actionItems.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold">Action items</p>
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
                    <p className="text-sm font-semibold">Recommendations</p>
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
                {voResult.risks?.length ? (
                  <div>
                    <p className="text-sm font-semibold">Risks</p>
                    <ul className="list-disc px-4 text-xs text-destructive">
                      {voResult.risks.map((risk) => (
                        <li key={risk}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
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
