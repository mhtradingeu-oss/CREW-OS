// nav-items.tsx
// Central navigation config for MH-OS SUPERAPP Admin UI
import {
  LayoutDashboard,
  Building2,
  Package,
  Tag,
  HeartHandshake,
  Users,
  Megaphone,
  Medal,
  Zap,
  ShieldCheck,
  Cpu,
  Globe2,
  Store,
  User,
  Settings,
  Sparkles,
} from "lucide-react";
import { ReactNode } from "react";

export type NavItem = {
  label: string;
  href: string;
  icon: ReactNode;
  section: string;
};

export const NAV_SECTIONS = [
  "Dashboard",
  "Brands",
  "Products",
  "Pricing",
  "Loyalty",
  "CRM",
  "Marketing",
  "Media",
  "Automation",
  "Governance",
  "AI HQ",
  "White Label",
  "Users & Roles",
  "Security",
  "Settings"
];

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" />, section: "Dashboard" },
  { label: "Brands", href: "/brands", icon: <Building2 className="h-5 w-5" />, section: "Brands" },
  { label: "Products", href: "/products", icon: <Package className="h-5 w-5" />, section: "Products" },
  { label: "Pricing", href: "/pricing", icon: <Tag className="h-5 w-5" />, section: "Pricing" },
  { label: "Loyalty", href: "/loyalty", icon: <HeartHandshake className="h-5 w-5" />, section: "Loyalty" },
  { label: "CRM", href: "/crm", icon: <Users className="h-5 w-5" />, section: "CRM" },
  { label: "Marketing", href: "/marketing", icon: <Megaphone className="h-5 w-5" />, section: "Marketing" },
  { label: "Media", href: "/media", icon: <Medal className="h-5 w-5" />, section: "Media" },
  { label: "Automation", href: "/automation", icon: <Zap className="h-5 w-5" />, section: "Automation" },
  { label: "Governance", href: "/governance", icon: <ShieldCheck className="h-5 w-5" />, section: "Governance" },
  { label: "AI HQ", href: "/ai-hq", icon: <Cpu className="h-5 w-5" />, section: "AI HQ" },
  { label: "White Label", href: "/white-label", icon: <Globe2 className="h-5 w-5" />, section: "White Label" },
  { label: "Users & Roles", href: "/users", icon: <User className="h-5 w-5" />, section: "Users & Roles" },
  { label: "Security", href: "/security", icon: <ShieldCheck className="h-5 w-5" />, section: "Security" },
  { label: "Settings", href: "/settings", icon: <Settings className="h-5 w-5" />, section: "Settings" },
];
