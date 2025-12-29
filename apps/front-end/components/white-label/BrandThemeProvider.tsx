import { ReactNode } from "react";

/**
 * BrandThemeProvider: Applies brand CSS variables for white-label preview.
 * No logic, no persistence, visual only.
 */
export function BrandThemeProvider({ brand, children }: { brand: any; children: ReactNode }) {
  // Example brand tokens (would be dynamic in real system)
  const style = {
    '--brand-primary': brand.primary,
    '--brand-secondary': brand.secondary,
    '--brand-surface': brand.surface,
    '--brand-text': brand.text,
  } as React.CSSProperties;
  return (
    <div style={style}>
      {children}
    </div>
  );
}
