"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, ChevronLeft } from "lucide-react";

import { NAV_ITEMS, NAV_SECTIONS } from "@/components/shell/nav-items.ts";
import { cn } from "@/lib/utils/index.ts";

export function Sidebar() {
  const pathname = usePathname() ?? "/";
  const [collapsed, setCollapsed] = useState(false);

  const grouped = NAV_SECTIONS.map((section) => ({
    section,
    items: NAV_ITEMS.filter((item) => item.section === section),
  })).filter((group) => group.items.length > 0);

  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        "h-full border-r border-white/5 bg-slate-950 text-slate-300 flex flex-col transition-all duration-200",
        collapsed ? "w-20" : "w-72"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-5",
          collapsed && "justify-center"
        )}
      >
        {!collapsed ? (
          <>
            <span className="text-xs uppercase tracking-[0.5em] text-slate-500">
              MH-OS
            </span>
            <button
              type="button"
              aria-label="Collapse sidebar"
              className="ml-auto rounded p-1.5 hover:bg-white/10 focus:outline-none focus-visible:ring"
              onClick={() => setCollapsed(true)}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </>
        ) : (
          <button
            type="button"
            aria-label="Expand sidebar"
            className="rounded p-1.5 hover:bg-white/10 focus:outline-none focus-visible:ring"
            onClick={() => setCollapsed(false)}
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className={cn("flex-1 overflow-y-auto pr-2", collapsed && "pr-0")}>
        {grouped.map(({ section, items }) => (
          <section key={section} className="mb-4">
            {!collapsed && (
              <div className="px-4 pb-1 pt-3">
                <p className="text-[0.625rem] uppercase tracking-[0.3em] text-slate-500 font-semibold">
                  {section}
                </p>
              </div>
            )}

            <ul className="space-y-1">
              {items.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring",
                        active
                          ? "bg-gradient-to-r from-primary/80 to-secondary/60 text-white border border-white/10"
                          : "border border-transparent hover:border-white/10 hover:bg-white/5",
                        collapsed && "justify-center px-2"
                      )}
                    >
                      {item.icon}
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {/* Footer */}
      <div
        className={cn(
          "flex items-center gap-3 border-t border-white/10 bg-white/5 p-3 text-xs uppercase tracking-[0.3em] text-slate-400",
          collapsed && "justify-center"
        )}
      >
        <span className="sr-only">AI Dock ready</span>
        <span
          aria-hidden
          className="rounded bg-emerald-900/60 px-2 py-1 text-emerald-300 font-semibold"
        >
          AI
        </span>
      </div>
    </nav>
  );
}
