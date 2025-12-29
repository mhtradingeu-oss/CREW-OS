// Architectural: Brand context for white-label readiness (read-only)
// No switching logic, just placeholder for brand-aware UI

import { createContext } from 'react';

export interface BrandContextType {
  brandName: string;
  logoUrl?: string;
  primaryColor?: string;
}

export const BrandContext = createContext<BrandContextType>({
  brandName: 'MH-OS',
});
