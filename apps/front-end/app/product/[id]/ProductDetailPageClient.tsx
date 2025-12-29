"use client";
import { useRouter, useParams } from "next/navigation";
import { useProduct } from "@/lib/api/hooks/product";
import { StatusBadge } from "@/components/product/StatusBadge";
import { Button } from "@/components/ui/button";

export default function ProductDetailPageClient() {
  const router = useRouter();
  const params = useParams();

  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : undefined;
  const { data, isLoading, isError, error } = useProduct(id ?? "");

  if (!id) {
    return <div className="p-8 text-center text-red-500">Invalid product ID.</div>;
  }

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (isError || !data) return <div className="p-8 text-center text-red-500">{error instanceof Error ? error.message : 'Failed to load product.'}</div>;

  return (
    <main className="max-w-2xl mx-auto px-2 py-6">
      <Button variant="outline" onClick={() => router.back()} className="mb-4">&larr; Back</Button>
      <div className="bg-white rounded shadow-sm p-6 mb-6">
        <div className="flex items-center gap-4 mb-2">
          <h1 className="text-xl font-bold flex-1">{data.name}</h1>
          <StatusBadge status={data.status} />
        </div>
        <div className="text-sm text-muted-foreground mb-2">SKU: {data.sku}</div>
        <div className="mb-4">{data.description || <span className="text-muted-foreground">No description</span>}</div>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <div>Created: {new Date(data.createdAt).toLocaleString()}</div>
          <div>Updated: {new Date(data.updatedAt).toLocaleString()}</div>
        </div>
      </div>
      <div className="bg-white rounded shadow-sm p-4">
        <div className="flex gap-4 border-b pb-2 mb-4">
          <span className="font-medium text-sm">Pricing</span>
          <span className="font-medium text-sm">Inventory</span>
          <span className="font-medium text-sm">AI</span>
        </div>
        <div className="text-muted-foreground text-sm">Tabs coming soon...</div>
      </div>
    </main>
  );
}
