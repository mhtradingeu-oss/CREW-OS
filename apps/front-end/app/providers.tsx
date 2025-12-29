"use client";

import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { AuthProvider } from "../lib/auth/auth-context.tsx";
import { Toaster } from "sonner";
// import { GlobalAssistantProvider } from "@/components/layout/global-assistant-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {/* <GlobalAssistantProvider> */}
            {children}
            <Toaster position="top-right" richColors />
          {/* </GlobalAssistantProvider> */}
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
