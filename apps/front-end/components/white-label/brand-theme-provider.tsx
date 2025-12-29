import React, { ReactNode } from "react";

/**
 * Visual-only provider for white-label brand context.
 * Injects CSS variables for brand tokens (no runtime mutation, no persistence).
 *
 * Usage:
 * <BrandThemeProvider brand={...}>{children}</BrandThemeProvider>
 */
export type BrandTheme = {
  name: string;
  logoUrl?: string; // Placeholder for logo
  primary: string; // e.g. #0055ff
  secondary: string; // e.g. #f5a623
  surface?: string; // Optional background
  text?: string; // Optional text color
};

const defaultTheme: BrandTheme = {
  name: "Default Brand",
  logoUrl: undefined,
  primary: "#0055ff",
  secondary: "#f5a623",
  surface: "#ffffff",
  text: "#222222",
};

export const BrandThemeProvider = ({
  brand = defaultTheme,
  children,
}: {
  brand?: BrandTheme;
  children: ReactNode;
}) => {
  // Only visual: inject CSS variables for brand tokens
  const style: React.CSSProperties = {
    // Brand tokens
    // These can be used in Tailwind via [var(--brand-primary)] syntax
    // and in shadcn/ui via className or style overrides
    // Governance colors (e.g. error, warning) are not overridden here
    //
    // Example: style={{ color: 'var(--brand-primary)' }}
    //
    // No runtime mutation, no persistence
    //
    // Add more tokens as needed
    ["--brand-primary" as any]: brand.primary,
    ["--brand-secondary" as any]: brand.secondary,
    ["--brand-surface" as any]: brand.surface || "#ffffff",
    ["--brand-text" as any]: brand.text || "#222222",
  };

  return (
    <div style={style}>
      {children}
    </div>
  );
};
