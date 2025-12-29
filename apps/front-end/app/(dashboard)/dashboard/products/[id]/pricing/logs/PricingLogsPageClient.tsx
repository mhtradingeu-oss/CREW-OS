"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { listLogs } from "@/lib/api/pricing";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { Spinner } from "@/components/ui/spinner";
import { apiErrorMessage } from "@/lib/api/client";
import { PermissionGuard } from "@/components/layout/permission-guard";

export default function PricingLogsPageClient() {
  const params = useParams();
  const productId = params?.id as string;
  const router = useRouter();
  const { hasPermission } = useAuth();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["pricing-logs", productId],
    queryFn: () => listLogs(productId),
    enabled: Boolean(productId),
  });

  if (!hasPermission("pricing:read")) return <div>Access denied.</div>;

  return (
    <PermissionGuard required="pricing:read">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Pricing Logs</h1>
          <Button variant="outline" onClick={() => router.push(`/dashboard/products/${productId}`)}>
            Back
          </Button>
        </div>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4" />
            Loading logs...
          </div>
        ) : isError ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            Failed to load logs: {apiErrorMessage(error)}
            <div>
              <Button variant="ghost" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          </div>
        ) : data && data.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
            No logs recorded yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Channel</TableHead>
                  <TableHead>Old</TableHead>
                  <TableHead>New</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data ?? []).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.channel ?? "-"}</TableCell>
                    <TableCell>{log.oldNet ?? "-"}</TableCell>
                    <TableCell>{log.newNet ?? "-"}</TableCell>
                    <TableCell>{log.summary ?? "-"}</TableCell>
                    <TableCell>{log.createdAt ? new Date(log.createdAt).toLocaleString() : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
