"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield } from "lucide-react";
import { superAdminNav, isActivePath } from "./super-admin-nav.tsx";
import { cn } from "@/lib/utils";

export function SuperAdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-white/10 bg-gradient-to-b from-slate-950 via-slate-900 to-black px-5 py-6 text-slate-100 shadow-2xl md:flex">
      <div className="mb-6 flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-300">
          <Shield className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Control Plane</p>
          <p className="text-sm font-semibold text-white">Super Admin</p>
        </div>
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto pr-1">
        {superAdminNav.map((section) => (
          <div key={section.title} className="space-y-2">
            <p className="text-[0.7rem] uppercase tracking-[0.25em] text-slate-500">{section.title}</p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                      active
                        ? "bg-emerald-500/15 text-white ring-1 ring-emerald-400/60"
                        : "text-slate-200 hover:bg-white/5 hover:text-white",
                    )}
                    title={item.label}
                  >
                    <span className={cn("flex h-8 w-8 items-center justify-center rounded-md border", active ? "border-emerald-400/40 bg-emerald-500/10" : "border-white/10 bg-white/5")}>{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-xs text-slate-300">
        Read-only controls unless explicitly enabled by backend policies.
      </div>
    </aside>
  );
}
