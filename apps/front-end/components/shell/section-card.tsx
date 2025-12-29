
import type { ReactNode } from "react";

export function SectionCard(props: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
      {props.children}
    </div>
  );
}
