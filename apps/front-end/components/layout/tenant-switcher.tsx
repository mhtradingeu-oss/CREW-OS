"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Select } from "@/components/ui/select";
// V1 PLACEHOLDER — EXECUTION DISABLED
// import { apiErrorMessage } from "@/lib/api/client";
// import { listBrands, type BrandDto } from "@/lib/api/brand";

const STORAGE_KEY = "mh-os-active-brand";

export function TenantSwitcher({
  onBrandChange,
}: {
  onBrandChange?: (brand: BrandDto | null) => void;
}) {
  const [selectedId, setSelectedId] = useState<string>("");

  const query = useQuery({
    queryKey: ["brands", { limit: 50 }],
    queryFn: () => listBrands({ pageSize: 50 }),
  });

  const options = useMemo(() => query.data?.data ?? [], [query.data?.data]);
  const activeBrand = useMemo(
    () => options.find((b) => b.id === selectedId) ?? null,
    [options, selectedId],
  );

  useEffect(() => {
    // Restore prior selection from localStorage when present
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored) setSelectedId(stored);
  }, []);

  useEffect(() => {
    // When data arrives and nothing is selected, default to the first brand
    const first = options[0];
    if (!selectedId && first) {
      setSelectedId(first.id);
      onBrandChange?.(first);
    }
  }, [options, onBrandChange, selectedId]);

  useEffect(() => {
    if (activeBrand) {
      localStorage.setItem(STORAGE_KEY, activeBrand.id);
      onBrandChange?.(activeBrand);
    }
  }, [activeBrand, onBrandChange]);

  const handleChange = (value: string) => {
    setSelectedId(value);
  };

  if (query.isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading brands…</span>
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
        Failed to load brands: {apiErrorMessage(query.error)}
      </div>
    );
  }

  if (!options.length) {
    return (
      <div className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
        No brands yet
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-2 text-sm">
      <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Brand</span>
      <Select value={selectedId} onChange={(e) => handleChange(e.target.value)} className="min-w-[10rem]">
        {options.map((brand) => (
          <option key={brand.id} value={brand.id} className="bg-background text-foreground">
            {brand.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
