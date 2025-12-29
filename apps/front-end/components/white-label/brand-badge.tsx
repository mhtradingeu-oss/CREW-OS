import React from "react";
import { BrandTheme } from "./brand-theme-provider";

export function BrandBadge({ brand }: { brand: BrandTheme }) {
  return (
    <div
      className="flex items-center px-3 py-1 rounded-full text-sm font-medium border"
      style={{
        background: "var(--brand-surface)",
        color: "var(--brand-primary)",
        borderColor: "var(--brand-primary)",
      }}
      title="Active brand (read-only)"
    >
      {brand.logoUrl ? (
        <img src={brand.logoUrl} alt={brand.name} className="w-5 h-5 rounded-full mr-2" />
      ) : (
        <span className="w-5 h-5 rounded-full bg-[var(--brand-primary)] text-white flex items-center justify-center mr-2" style={{ fontSize: 12 }}>
          {brand.name[0]}
        </span>
      )}
      <span>{brand.name}</span>
      <span className="ml-2 text-xs text-[var(--brand-secondary)]">(read-only)</span>
    </div>
  );
}
