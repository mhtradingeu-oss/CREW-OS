"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listPricing } from "@/lib/api/pricing";
import type { PricingDto } from "@/lib/types/pricing";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { useAuth } from "@/lib/auth/auth-context";
import { apiErrorMessage } from "@/lib/api/client";
import { Spinner } from "@/components/ui/spinner";

export default function PricingPageClient() {
  const [productId, setProductId] = useState("");
  const router = useRouter();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery<{ data: PricingDto[]; total: number } | null>({
    queryKey: ["pricing", productId],
    queryFn: () => listPricing({ productId: productId || undefined }),
  });

  const summary = useMemo(() => {
    const records: PricingDto[] = data?.data ?? [];
    const priced = records.filter((item: PricingDto) => item.basePrice !== null && item.basePrice !== undefined);
    return {
      total: data?.total ?? 0,
      priced: priced.length,
      avgNet: priced.length
        ? (priced.reduce((sum: number, item: PricingDto) => sum + (item.basePrice ?? 0), 0) / priced.length).toFixed(2)
        : "-",
    };
  }, [data]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pricing"
        description="Guard price bands, review drafts, and reconcile margins before deployment."
        actions={
          hasPermission("pricing:create") ? (
            <Button onClick={() => router.push("/dashboard/products")}>Add price</Button>
          ) : null
        }
        meta={
          <InfoTooltip content="Pricing data originates from `ProductPricing` records and AI history." />
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs uppercase text-muted-foreground">Total records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{summary.total}</div>
            <p className="text-xs text-muted-foreground">Covers all channels & brands</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs uppercase text-muted-foreground">Priced SKUs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{summary.priced}</div>
            <p className="text-xs text-muted-foreground">Ready for publish</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex items-center gap-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">Avg net</CardTitle>
            <InfoTooltip content="B2C net average for priced records." />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">€{summary.avgNet}</div>
            <p className="text-xs text-muted-foreground">Baseline margin check</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Price table</h2>
              <InfoTooltip content="Filters default by productId; this table shows B2C, dealer, and VAT values." />
            </div>
            <p className="text-xs text-muted-foreground">
              Filtered by product ID, brand, or channel.
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Filter by product id"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-64"
            />
            <Button
              variant="outline"
              onClick={() =>
                void queryClient.invalidateQueries({ queryKey: ["pricing", productId] })
              }
            >
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="h-4 w-4" />
              Loading pricing...
            </div>
          ) : isError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
              Failed to load pricing: {apiErrorMessage(error)}
              <div className="mt-2">
                <Button variant="ghost" size="sm" onClick={() => refetch()}>
                  Retry
                </Button>
              </div>
            </div>
          ) : data && data.total === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
              No pricing records yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Base price</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Margin</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.map((pricing: PricingDto) => (
                    <TableRow key={pricing.id}>
                      <TableCell className="text-xs font-semibold">{pricing.id}</TableCell>
                      <TableCell className="text-sm text-foreground">{pricing.productId}</TableCell>
                      <TableCell>{pricing.basePrice ?? "-"}</TableCell>
                      <TableCell>{pricing.cost ?? "-"}</TableCell>
                      <TableCell>{pricing.margin ?? "-"}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Link
                          href={`/dashboard/pricing/${pricing.id}`}
                          className="text-primary text-sm hover:underline"
                        >
                          View
                        </Link>
                        <Link
                          href={`/dashboard/products/${pricing.productId}/pricing/drafts`}
                          className="text-primary text-sm hover:underline"
                        >
                          Drafts
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
