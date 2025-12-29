
"use client";
import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useProducts } from "@/lib/api/hooks/product";

import { DataTable } from "@/components/product/DataTable";
import { EmptyState } from "@/components/product/EmptyState";
import { Pagination } from "@/components/product/Pagination";
import { StatusBadge } from "@/components/product/StatusBadge";
import { PermissionGuard } from "@/components/layout/permission-guard";
import { Button } from "@/components/ui/button";
// Fallback for missing useMediaQuery import
// Fallback for missing useMediaQuery import
const useMediaQuery = () => false;
// Responsive card for mobile
function ProductCard({ product, actions }: { product: any; actions: React.ReactNode }) {
  return (
    <div className="bg-white rounded shadow-sm p-4 flex flex-col gap-2 mb-3">
      <div className="flex items-center gap-2">
        <span className="font-medium text-base flex-1">{product.name}</span>
        <StatusBadge status={product.status} />
      </div>
      <div className="text-xs text-muted-foreground">SKU: {product.sku}</div>
      <div className="text-xs text-muted-foreground">Created: {new Date(product.createdAt).toLocaleDateString()}</div>
      <div className="flex gap-2 mt-2">{actions}</div>
    </div>
  );
}

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

function useUrlParams() {
  const params = useSearchParams();
  const get = (key: string, fallback?: string) => params.get(key) || fallback || "";
  return {
    page: parseInt(get("page", "1"), 10),
    limit: parseInt(get("limit", "10"), 10),
    search: get("search"),
    status: get("status"),
  };
}

export default function ProductPageClient() {
  const router = useRouter();
  const urlParams = useUrlParams();
  const [searchInput, setSearchInput] = useState(urlParams.search);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const { data, isLoading, isError } = useProducts({
    page: urlParams.page,
    limit: urlParams.limit,
    search: urlParams.search,
    status: urlParams.status,
  });


  // Safe error guard for EmptyState
  const errorMessage =
    isError && typeof isError === "object" && "message" in isError
      ? String((isError as Error).message)
      : "Failed to load products.";

  // Debounced search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchTimeout(
      setTimeout(() => {
        router.push(
          `?${new URLSearchParams({
            page: String(urlParams.page),
            limit: String(urlParams.limit),
            search: value,
            status: urlParams.status || "",
          }).toString()}`
        );
      }, 400)
    );
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(
      `?${new URLSearchParams({
        page: String(urlParams.page),
        limit: String(urlParams.limit),
        search: urlParams.search || "",
        status: e.target.value,
      }).toString()}`
    );
  };

  const handlePageChange = (page: number) => {
    router.push(
      `?${new URLSearchParams({
        page: String(page),
        limit: String(urlParams.limit),
        search: urlParams.search || "",
        status: urlParams.status || "",
      }).toString()}`
    );
  };

  const columns = useMemo(
    () => [
      { key: "name", label: "Name", render: (row: any) => <span className="font-medium">{row.name}</span> },
      { key: "sku", label: "SKU" },
      { key: "status", label: "Status", render: (row: any) => <StatusBadge status={row.status} /> },
      { key: "createdAt", label: "Created", render: (row: any) => new Date(row.createdAt).toLocaleDateString() },
      {
        key: "actions",
        label: "Actions",
        render: (row: any) => (
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <a href={`/product/${row.id}`}>View</a>
            </Button>
            <PermissionGuard required="product:delete">
              <Button size="sm" variant="destructive">Delete</Button>
            </PermissionGuard>
          </div>
        ),
      },
    ],
    []
  );

  const isMobile = useMediaQuery();

  return (
    <main className="max-w-5xl mx-auto px-2 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <p className="text-muted-foreground">Browse and manage your product catalog.</p>
      </div>
      {/* Filters/search: collapse on mobile */}
      <details className="md:open mb-4" open>
        <summary className="md:hidden cursor-pointer font-medium mb-2">Filters & Search</summary>
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name or SKU..."
              className="w-full border rounded px-3 py-2 text-sm"
              value={searchInput}
              onChange={handleSearchChange}
              aria-label="Search products"
            />
          </div>
          <div>
            <select
              className="border rounded px-3 py-2 text-sm"
              value={urlParams.status}
              onChange={handleStatusChange}
              aria-label="Filter by status"
            >
              {STATUS_OPTIONS.map((opt: { value: string; label: string }) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <PermissionGuard required="product:create">
            <Button className="ml-auto">Create Product</Button>
          </PermissionGuard>
        </div>
      </details>
      {/* Table for desktop, cards for mobile */}
      <div className="mt-2">
        {isMobile ? (
          <div>
            {isLoading ? (
              <div className="py-8 text-center">Loading...</div>
            ) : !data?.data?.length ? (
              <EmptyState message={isError ? 'Failed to load products.' : "No products found."} />
            ) : (
              data.data.map((product: typeof data.data extends (infer U)[] ? U : unknown) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  actions={
                    <>
                      <Button asChild size="sm" variant="outline">
                        <a href={`/product/${product.id}`}>View</a>
                      </Button>
                      <PermissionGuard required="product:delete">
                        <Button size="sm" variant="destructive">Delete</Button>
                      </PermissionGuard>
                    </>
                  }
                />
              ))
            )}
          </div>
        ) : (
          <div className="bg-white rounded shadow-sm">
            <DataTable
              columns={columns}
              data={data?.data || []}
              loading={isLoading}
              empty={<EmptyState message={isError ? ((isError as any) instanceof Error ? (isError as any).message : 'Failed to load products.') : "No products found."} />}
            />
          </div>
        )}
      </div>
      <Pagination
        page={data?.page || 1}
        total={data?.total || 0}
        limit={data?.limit || 10}
        onPageChange={handlePageChange}
      />
    </main>
  );
}
