"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";

type RequireAuthProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

export function RequireAuth({ children, fallback }: RequireAuthProps) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <>{fallback ?? <div className="p-6 text-center">Loading...</div>}</>;
  }

  if (status === "unauthenticated") {
    return <>{fallback ?? <div className="p-6 text-center">Redirecting...</div>}</>;
  }

  return <>{children}</>;
}
