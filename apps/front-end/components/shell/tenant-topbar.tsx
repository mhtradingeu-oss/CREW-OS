"use client";

import { ReactNode } from "react";
import { GlobalSearch } from "@/components/layout/global-search";
import { NotificationBell } from "@/components/layout/notification-bell";
import { TenantSwitcher } from "@/components/layout/tenant-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/navbar/user-menu";
import { useGlobalAssistant } from "@/components/layout/global-assistant-provider";
import { Button } from "@/components/ui/button";
import { Command, Sparkles } from "lucide-react";

export type TenantTopbarProps = {
  breadcrumbs?: ReactNode;
};

export function TenantTopbar({ breadcrumbs }: TenantTopbarProps) {
  const { openAssistant, openCommandPalette } = useGlobalAssistant();
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-border/80 bg-background/90 px-4 py-3 backdrop-blur">
      <div className="flex flex-1 items-center gap-3">
        <div className="hidden sm:block">
          <TenantSwitcher />
        </div>
        <GlobalSearch />
        {breadcrumbs ? (
          <div className="hidden min-w-[12rem] items-center gap-2 text-xs text-muted-foreground md:flex">
            {breadcrumbs}
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="hidden sm:inline-flex"
          onClick={openCommandPalette}
          title="Command Palette (Ctrl/Cmd + K)"
        >
          <Command className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="sm" className="flex items-center gap-2" onClick={() => openAssistant()}>
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
