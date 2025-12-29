"use client";

import { useState } from "react";
// V1 PLACEHOLDER — EXECUTION DISABLED
// import { api } from "@/lib/api/client";
// import { apiErrorMessage } from "@/lib/api/client";
import { toast } from "sonner";

// V1 read-only: AI execution is disabled
export function useAIRequest<T = unknown>(path: string) {
  return {
    run: async () => {
      // V1 PLACEHOLDER — EXECUTION DISABLED
      toast("AI execution is disabled in V1");
      return null;
    },
    data: null,
    loading: false,
    error: "AI execution is disabled in V1",
  };
}
