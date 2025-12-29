import { ReactNode } from "react";
import {
  ActivitySquare,
  AlarmCheck,
  Binary,
  Building2,
  CircuitBoard,
  FlagTriangleRight,
  LayoutDashboard,
  Network,
  ShieldCheck,
  ShieldHalf,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

export type SuperNavItem = {
  label: string;
  href: string;
  icon: ReactNode;
  description?: string;
};

export type SuperNavSection = {
  title: string;
  items: SuperNavItem[];
};

export const superAdminNav: SuperNavSection[] = [
  {
    title: "Mission Control",
    items: [
      { label: "Overview", href: "/superadmin", icon: <LayoutDashboard className="h-4 w-4" /> },
      { label: "Tenants", href: "/superadmin/tenants", icon: <Network className="h-4 w-4" /> },
      { label: "Brands", href: "/superadmin/brands", icon: <Building2 className="h-4 w-4" /> },
      { label: "Plans & Flags", href: "/superadmin/plans", icon: <FlagTriangleRight className="h-4 w-4" /> },
      { label: "Users & Roles", href: "/superadmin/users", icon: <Users className="h-4 w-4" /> },
    ],
  },
  {
    title: "AI Governance",
    items: [
      { label: "AI Agents", href: "/superadmin/ai-agents", icon: <Sparkles className="h-4 w-4" /> },
      { label: "AI Safety", href: "/superadmin/ai-safety/firewall", icon: <ShieldCheck className="h-4 w-4" /> },
      { label: "AI Monitoring", href: "/superadmin/ai-monitoring", icon: <CircuitBoard className="h-4 w-4" /> },
    ],
  },
  {
    title: "Reliability",
    items: [
      { label: "System Health", href: "/superadmin/system-health", icon: <AlarmCheck className="h-4 w-4" /> },
      { label: "Platform Ops", href: "/superadmin/platform-ops", icon: <ActivitySquare className="h-4 w-4" /> },
      { label: "Banned Actions", href: "/superadmin/ai-safety/banned-actions", icon: <ShieldHalf className="h-4 w-4" /> },
      { label: "Safety Events", href: "/superadmin/ai-safety/events", icon: <Binary className="h-4 w-4" /> },
      { label: "Fallbacks", href: "/superadmin/ai-monitoring#fallbacks", icon: <Zap className="h-4 w-4" /> },
    ],
  },
];

export function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/superadmin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`) || pathname.startsWith(`${href}#`);
}
