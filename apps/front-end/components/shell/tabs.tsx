"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type TabItem = {
  value: string;
  label: string;
  content: React.ReactNode;
};

export type TabsProps = {
  tabs: TabItem[];
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
};

export function Tabs({ tabs, defaultValue, onChange, className }: TabsProps) {
  const initial = defaultValue ?? tabs[0]?.value ?? "";
  const [value, setValue] = useState(initial);

  const handleSelect = (next: string) => {
    setValue(next);
    onChange?.(next);
  };

  const active = tabs.find((tab) => tab.value === value) ?? tabs[0];

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-card/70 p-1">
        {tabs.map((tab: typeof tabs[number]) => {
          const isActive = tab.value === value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleSelect(tab.value)}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent/60",
              )}
              aria-pressed={isActive}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="rounded-lg border border-border/60 bg-card/60 p-4 shadow-sm">
        {active?.content}
      </div>
    </div>
  );
}
