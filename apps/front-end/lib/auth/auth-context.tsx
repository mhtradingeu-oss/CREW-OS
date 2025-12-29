"use client";

import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, onUnauthorized } from "@/lib/api/client";
import { AuthSessionResponse, type LoginDto, type RegisterDto } from "@mh-os/shared";
import { getDashboardRouteForRole } from "@/lib/auth/routes";

type SessionUser = AuthSessionResponse["user"];
export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  session: AuthSessionResponse | null;
  user: SessionUser | null;
  tenant: AuthSessionResponse["tenant"] | null;
  plan: AuthSessionResponse["plan"] | null;
  status: AuthStatus;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (params: LoginDto) => Promise<AuthSessionResponse>;
  register: (params: RegisterDto) => Promise<AuthSessionResponse>;
  logout: () => void;
  refresh: () => Promise<AuthSessionResponse | null>;
  hasPermission: (permission: string | string[]) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasRole: (required: string | string[]) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSessionResponse | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      setStatus("loading");
      const { data } = await api.get<AuthSessionResponse>("/auth/me");
      setSession(data);
      setStatus("authenticated");
      return data;
    } catch (err) {
      setSession(null);
      setStatus("unauthenticated");
      return null;
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = async ({ email, password }: LoginDto) => {
    try {
      setStatus("loading");
      const { data } = await api.post<AuthSessionResponse>("/auth/login", { email, password });
      setSession(data);
      setStatus("authenticated");
      router.push(getDashboardRouteForRole(data.user?.role));
      return data;
    } catch (err) {
      setStatus("unauthenticated");
      throw err;
    }
  };

  const register = async ({ email, password }: RegisterDto) => {
    try {
      setStatus("loading");
      const { data } = await api.post<AuthSessionResponse>("/auth/register", { email, password });
      setSession(data);
      setStatus("authenticated");
      router.push(getDashboardRouteForRole(data.user?.role));
      return data;
    } catch (err) {
      setStatus("unauthenticated");
      throw err;
    }
  };

  const logout = () => {
    void api.post("/auth/logout").catch(() => {});
    setSession(null);
    setStatus("unauthenticated");
    router.push("/auth/login");
  };

  const hasPermission = (permission: string | string[]) => {
    const userPermissions = session?.user.permissions ?? [];
    if (userPermissions.includes("*")) return true;
    const required = Array.isArray(permission) ? permission : [permission];
    return required.some((perm) => userPermissions.includes(perm));
  };

  const hasAnyPermission = (permissions: string[]) => {
    const userPermissions = session?.user.permissions ?? [];
    if (userPermissions.includes("*")) return true;
    return permissions.some((perm) => userPermissions.includes(perm));
  };

  const hasAllPermissions = (permissions: string[]) => {
    const userPermissions = session?.user.permissions ?? [];
    if (userPermissions.includes("*")) return true;
    return permissions.every((perm) => userPermissions.includes(perm));
  };

  const hasRole = (required: string | string[]) => {
    if (!session?.user) return false;
    const desired = Array.isArray(required) ? required : [required];
    return desired.includes(session.user.role);
  };

  const hasAnyRole = (roles: string[]) => {
    return hasRole(roles);
  };

  useEffect(() => {
    onUnauthorized(() => {
      setSession(null);
      setStatus("unauthenticated");
    });
  }, []);

  const user = session?.user ?? null;
  const tenant = session?.tenant ?? null;
  const plan = session?.plan ?? null;
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        tenant,
        plan,
        status,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
        refresh,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasRole,
        hasAnyRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
