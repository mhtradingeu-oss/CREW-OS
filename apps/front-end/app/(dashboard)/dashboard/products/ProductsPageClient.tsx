"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listProducts, removeProduct, type ProductDto } from "@/lib/api/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/lib/auth/auth-context";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api/client";
import { Spinner } from "@/components/ui/spinner";

export default function ProductsPageClient() {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["products", search],
    queryFn: () => listProducts({ search: search || undefined }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeProduct(id),
    onSuccess: () => {
      toast.success("Product deleted");
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const handleDelete = (product: ProductDto) => {
    if (!hasPermission("product:delete")) return;
    if (confirm(`Delete ${product.name}?`)) {
      removeMutation.mutate(product.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Products</h1>
        {hasPermission("product:create") && (
          <Button onClick={() => router.push("/dashboard/products/create")}>Create</Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search products"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <Button
          variant="outline"
          onClick={() => void queryClient.invalidateQueries({ queryKey: ["products"] })}
        >
          Search
        </Button>
      </div>
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4" />
          Loading products...
        </div>
      ) : isError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load products: {apiErrorMessage(error)}
          <div>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </div>
      ) : data && data.total === 0 ? (
        <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
          No products yet.{" "}
          {hasPermission("product:create") && (
            <Button
              variant="ghost"
              className="px-1"
              onClick={() => router.push("/dashboard/products/create")}
            >
              Create first product
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.map((product: import('@/lib/api/product').ProductDto) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.sku ?? "-"}</TableCell>
                  <TableCell>{product.status ?? "-"}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Link
                      href={`/dashboard/products/${product.id}`}
                      className="text-primary text-sm"
                    >
                      View
                    </Link>
                    <Link
                      href={`/dashboard/products/${product.id}/pricing/drafts`}
                      className="text-primary text-sm"
                    >
                      Pricing
                    </Link>
                    {hasPermission("product:delete") && (
                      <button
                        className="text-red-500 text-sm"
                        onClick={() => handleDelete(product)}
                        disabled={removeMutation.isPending}
                      >
                        Delete
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
