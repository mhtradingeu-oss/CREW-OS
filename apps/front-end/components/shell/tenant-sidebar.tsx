"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import {
  Activity,
  Bot,
  Building2,
  Cpu,
  Globe2,
  LayoutDashboard,
  LineChart,
  Map,
  Megaphone,
  Package,
  ShieldCheck,
  Store,
  Tag,
  Users,
  Zap,
  Layers,
  BellRing,
  HeartHandshake,
  LifeBuoy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";

export type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  permission?: string | string[];
  roles?: string[];
  exact?: boolean;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    ],
  },
  {
    title: "Commerce",
    items: [
      { href: "/commerce/pricing", label: "Pricing", icon: <Tag className="h-4 w-4" />, permission: "pricing:read" },
      { href: "/commerce/products", label: "Products", icon: <Package className="h-4 w-4" />, permission: "product:read" },
      { href: "/commerce/inventory", label: "Inventory", icon: <Layers className="h-4 w-4" />, permission: "inventory:read" },
    ],
  },
  {
    title: "Growth",
    items: [
      { href: "/growth/crm", label: "CRM", icon: <Users className="h-4 w-4" />, permission: "crm:read" },
      { href: "/growth/marketing", label: "Marketing", icon: <Megaphone className="h-4 w-4" />, permission: "marketing:read" },
      { href: "/growth/loyalty", label: "Loyalty", icon: <HeartHandshake className="h-4 w-4" />, permission: "loyalty:read" },
    ],
  },
  {
    title: "Field",
    items: [
      { href: "/field/stand", label: "Stand / POS", icon: <Store className="h-4 w-4" />, permission: "pos:read" },
      { href: "/field/sales-reps", label: "Sales Reps", icon: <Map className="h-4 w-4" />, permission: ["sales-rep:read", "sales-rep:kpi"] },
    ],
  },
  {
    title: "AI",
    items: [
      { href: "/admin/ai-hq", label: "AI HQ", icon: <Cpu className="h-4 w-4" />, permission: "ai:read" },
      { href: "/dashboard/assistant", label: "Assistant", icon: <Bot className="h-4 w-4" />, permission: "ai:run" },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/admin", label: "Command Center", icon: <ShieldCheck className="h-4 w-4" />, roles: ["SUPER_ADMIN", "ADMIN"] },
      { href: "/admin/users", label: "Users & RBAC", icon: <ShieldCheck className="h-4 w-4" />, roles: ["SUPER_ADMIN", "ADMIN"] },
      { href: "/admin/brands", label: "Brands & Tenants", icon: <Building2 className="h-4 w-4" />, roles: ["SUPER_ADMIN", "ADMIN"] },
      { href: "/admin/notifications", label: "Notifications", icon: <BellRing className="h-4 w-4" />, permission: "notification:read" },
      { href: "/admin/automations", label: "Automations", icon: <Zap className="h-4 w-4" />, permission: "automation:read" },
      { href: "/admin/platform-ops", label: "Platform Ops", icon: <Activity className="h-4 w-4" />, roles: ["SUPER_ADMIN", "ADMIN"] },
      { href: "/support", label: "Support", icon: <LifeBuoy className="h-4 w-4" />, permission: "support:read" },
    ],
  },
  {
    title: "Virtual Office",
    items: [{ href: "/virtual-hq", label: "Virtual HQ", icon: <Globe2 className="h-4 w-4" /> }],
  },
];

const matchesRoute = (pathname: string | null, item: NavItem) => {
  if (!pathname) return false;
  if (item.exact) {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
};

export function TenantSidebar() {
  const pathname = usePathname();
  const { hasPermission, hasAnyPermission, hasRole } = useAuth();

  const canView = (item: NavItem) => {
    if (item.roles && !hasRole(item.roles)) return false;
    if (!item.permission) return true;
    if (Array.isArray(item.permission)) {
      return hasAnyPermission(item.permission);
    }
    return hasPermission(item.permission);
  };

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card/80 px-4 py-6 shadow-sm md:flex md:flex-col">
      <div className="mb-6 space-y-1">
        <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">MH-OS</p>
        <h2 className="text-lg font-semibold text-foreground">Superapp</h2>
        <p className="text-xs text-muted-foreground">Unified shell</p>
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto pr-1">
        {navSections.map((section: typeof navSections[number]) => (
          <div key={section.title} className="space-y-2">
            <p className="text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">{section.title}</p>
            <div className="space-y-1">
              {section.items.filter(canView).map((item: typeof section.items[number]) => {
                const active = matchesRoute(pathname, item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "hover:bg-accent/70",
                    )}
                    title={item.label}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="text-xs text-muted-foreground">AI-ready shell</div>
    </aside>
  );
}
