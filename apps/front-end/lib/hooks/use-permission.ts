"use client";

import { useAuth } from "@/lib/auth/auth-context";

export function usePermission(permission: string | string[]) {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
}
