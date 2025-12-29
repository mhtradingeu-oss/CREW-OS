"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listBrands, removeBrand, type BrandDto } from "@/lib/api/brand";
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
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/auth-context";
import { apiErrorMessage } from "@/lib/api/client";
import { Spinner } from "@/components/ui/spinner";

export default function BrandsPageClient() {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["brands", search],
    queryFn: () => listBrands({ search: search || undefined }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeBrand(id),
    onSuccess: () => {
      toast.success("Brand removed");
      void queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const handleDelete = (brand: BrandDto) => {
    if (!hasPermission("brand:delete")) return;
    if (confirm(`Delete ${brand.name}?`)) {
      removeMutation.mutate(brand.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Directory</p>
          <h1 className="text-xl font-semibold">Brands</h1>
          <p className="text-sm text-muted-foreground">Search, view, and manage brands across your tenant.</p>
        </div>
        {hasPermission("brand:create") && (
          <Button onClick={() => router.push("/dashboard/brands/create")}>Create brand</Button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search brand"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? "Searching..." : "Search"}
        </Button>
        {search && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              void queryClient.invalidateQueries({ queryKey: ["brands"] });
            }}
          >
            Clear
          </Button>
        )}
      </div>
      {isLoading ? (
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Country</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, idx) => (
                <TableRow key={idx} className="animate-pulse">
                  <TableCell>
                    <div className="h-4 w-32 rounded bg-muted" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-28 rounded bg-muted" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-20 rounded bg-muted" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="ml-auto h-4 w-16 rounded bg-muted" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : isError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load brands: {apiErrorMessage(error)}
          <div>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </div>
      ) : data && data.total === 0 ? (
        <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
          {search ? "No brands match this search." : "No brands yet."}
          {hasPermission("brand:create") && (
            <Button
              variant="ghost"
              className="px-1"
              onClick={() => router.push("/dashboard/brands/create")}
            >
              {search ? "Create brand" : "Create first brand"}
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Country</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell>{brand.name}</TableCell>
                  <TableCell>{brand.slug}</TableCell>
                  <TableCell>{brand.countryOfOrigin ?? "-"}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Link href={`/dashboard/brands/${brand.id}`} className="text-primary text-sm">
                      View
                    </Link>
                    {hasPermission("brand:delete") && (
                      <button
                        className="text-red-500 text-sm"
                        onClick={() => handleDelete(brand)}
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
