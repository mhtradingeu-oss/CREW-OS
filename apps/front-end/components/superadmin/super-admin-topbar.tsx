"use client";

import { FormEvent, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Command, Search, Sparkles } from "lucide-react";
import { NotificationBell } from "@/components/layout/notification-bell";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/navbar/user-menu";
import { Input } from "@/components/ui/input";
import { superAdminNav, isActivePath } from "./super-admin-nav.tsx";
import { useGlobalAssistant } from "@/components/layout/global-assistant-provider";
import { Button } from "@/components/ui/button";

export function SuperAdminTopbar() {
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const { openAssistant, openCommandPalette } = useGlobalAssistant();

  const activeLabel = useMemo(() => {
    for (const section of superAdminNav) {
      for (const item of section.items) {
        if (isActivePath(pathname, item.href)) return item.label;
      }
    }
    return "Control Plane";
  }, [pathname]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="hidden rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.25em] text-slate-400 sm:flex">
          Super Admin
        </div>
        <div className="text-sm font-semibold text-white">{activeLabel}</div>
      </div>
      <div className="flex flex-1 items-center justify-end gap-3">
        <form onSubmit={handleSearch} className="hidden w-full max-w-sm items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 shadow-inner sm:flex">
          <Search className="h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tenants, policies, agents..."
            className="border-none bg-transparent px-0 text-sm text-white placeholder:text-slate-500 focus-visible:ring-0"
          />
          <button
            type="button"
            onClick={openCommandPalette}
            className="ml-auto flex items-center gap-1 rounded border border-white/10 px-2 py-0.5 text-[11px] text-slate-400 hover:border-emerald-400/60 hover:text-emerald-100"
            title="Command Palette (Ctrl/Cmd + K)"
          >
            <Command className="h-3 w-3" /> K
          </button>
        </form>
        <Button size="sm" variant="outline" className="hidden md:inline-flex items-center gap-2" onClick={openCommandPalette}>
          <Command className="h-4 w-4" />
          Palette
        </Button>
        <Button size="sm" variant="secondary" className="flex items-center gap-2" onClick={() => openAssistant()}>
          <Sparkles className="h-4 w-4" />
          Ask Hairo
        </Button>
        <NotificationBell />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
