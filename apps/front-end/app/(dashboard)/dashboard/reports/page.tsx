"use client";

import { useEffect, useMemo, useState } from "react";
import { listReports, createReport, getReportRendered } from "@/lib/api/ai-brain";
import { listBrands } from "@/lib/api/brand";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiErrorMessage } from "@/lib/api/client";
import { toast } from "sonner";
import { PermissionGuard } from "@/components/layout/permission-guard";
import { useAiReports } from "@/lib/hooks/use-ai-reports";
import { Modal } from "@/components/ui/modal";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/lib/auth/auth-context";

export default function ReportsPage() {
  const [brands, setBrands] = useState<any[]>([]);
  const [brandId, setBrandId] = useState<string | undefined>(undefined);
  const [scope, setScope] = useState<string | undefined>(undefined);
  const [periodStart, setPeriodStart] = useState<string>("");
  const [periodEnd, setPeriodEnd] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [renderedReport, setRenderedReport] = useState<any | null>(null);
  const { hasPermission } = useAuth();

  const reportParams = useMemo(
    () => ({
      brandId,
      scope,
      periodStart: periodStart || undefined,
      periodEnd: periodEnd || undefined,
    }),
    [brandId, scope, periodStart, periodEnd],
  );

  const reportQuery = useAiReports(reportParams);

  const loadBrands = async () => {
    try {
      const brandList = await listBrands();
      setBrands(brandList?.data ?? []);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  useEffect(() => {
    void loadBrands();
  }, []);

  useEffect(() => {
    if (reportQuery.error) {
      toast.error(apiErrorMessage(reportQuery.error));
    }
  }, [reportQuery.error]);

  const generate = async () => {
    try {
      setCreating(true);
      await createReport({
        title: "Automated Report",
        brandId,
        scope,
        periodStart: periodStart ? new Date(periodStart) : undefined,
        periodEnd: periodEnd ? new Date(periodEnd) : undefined,
      });
      toast.success("Report created");
      await reportQuery.refetch();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const loadRendered = async (report: any) => {
    try {
      setSelectedReport(report);
      setRenderedReport(null);
      const data = await getReportRendered(report.id);
      setRenderedReport(data);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const downloadFile = (name: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const copyMarkdown = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <PermissionGuard required="ai:read">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold">AI Reports</h1>
            <p className="text-sm text-muted-foreground">
              Brand-aware strategy reports with markdown + HTML output. Filter by scope and
              timeframe, then export or copy.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-md border px-3 py-2 text-sm"
              value={brandId ?? ""}
              onChange={(e) => setBrandId(e.target.value || undefined)}
            >
              <option value="">All brands</option>
              {brands.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <select
              className="rounded-md border px-3 py-2 text-sm"
              value={scope ?? ""}
              onChange={(e) => setScope(e.target.value || undefined)}
            >
              <option value="">All scopes</option>
              <option value="pricing">Pricing</option>
              <option value="crm">CRM</option>
              <option value="marketing">Marketing</option>
              <option value="inventory">Inventory</option>
              <option value="loyalty">Loyalty</option>
            </select>
            <input
              type="date"
              className="rounded-md border px-3 py-2 text-sm"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
            />
            <input
              type="date"
              className="rounded-md border px-3 py-2 text-sm"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
            />
            <Button
              variant="outline"
              onClick={() => reportQuery.refetch()}
              disabled={reportQuery.isFetching}
            >
              Refresh
            </Button>
            {hasPermission("ai:run") && (
              <Button onClick={generate} disabled={creating || reportQuery.isFetching}>
                {creating ? "Generating..." : "Generate Report"}
              </Button>
            )}
          </div>
        </div>
        {reportQuery.isLoading ? (
          <Skeleton className="h-8 w-full" />
        ) : reportQuery.isError ? (
          <div className="flex items-center justify-between rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm">
            <span className="text-destructive">{apiErrorMessage(reportQuery.error)}</span>
            <Button size="sm" onClick={() => reportQuery.refetch()}>
              Retry
            </Button>
          </div>
        ) : reportQuery.data?.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-md border border-dashed p-6 text-sm text-muted-foreground">
            <div>No reports yet.</div>
            {hasPermission("ai:run") && (
              <Button size="sm" onClick={generate} disabled={creating}>
                Generate first report
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {reportQuery.data?.map((item: any) => (
              <div key={item.id} className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{item.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.brandId ? `Brand ${item.brandId}` : "All brands"} •{" "}
                      {item.scope ?? "N/A"} •{" "}
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => loadRendered(item)}>
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={!!selectedReport}
        onClose={() => {
          setSelectedReport(null);
          setRenderedReport(null);
        }}
        title={renderedReport?.title ?? "Report"}
      >
        {renderedReport ? (
          <div className="space-y-3 text-sm">
            <div className="text-muted-foreground">
              {renderedReport.scope ?? "N/A"} •{" "}
              {renderedReport.createdAt ? new Date(renderedReport.createdAt).toLocaleString() : ""}
            </div>
            <ReactMarkdown className="prose prose-sm max-w-none">
              {renderedReport.contentMarkdown ?? ""}
            </ReactMarkdown>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyMarkdown(renderedReport.contentMarkdown ?? "")}
              >
                Copy markdown
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  downloadFile(
                    `${renderedReport.title || "report"}.md`,
                    renderedReport.contentMarkdown ?? "",
                  )
                }
              >
                Download Markdown
              </Button>
              {renderedReport.contentHtmlSafe ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    downloadFile(
                      `${renderedReport.title || "report"}.html`,
                      renderedReport.contentHtmlSafe ?? "",
                    )
                  }
                >
                  Download HTML
                </Button>
              ) : null}
            </div>
          </div>
        ) : (
          <Skeleton className="h-24 w-full" />
        )}
      </Modal>
    </PermissionGuard>
  );
}
