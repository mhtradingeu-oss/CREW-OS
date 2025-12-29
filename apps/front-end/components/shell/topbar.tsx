// Server Component: Topbar
import { Bell, ShieldCheck } from "lucide-react";

export function Topbar() {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-slate-950/90 px-6 py-3 backdrop-blur">
      <div className="flex items-center gap-4">
        <span className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-emerald-400" aria-hidden />
          MH-OS SUPERAPP
        </span>
        <span className="ml-3 rounded bg-blue-900/60 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-blue-300">Production</span>
      </div>
      <div className="flex items-center gap-4">
        <button
          aria-label="Notifications"
          className="relative rounded-full p-2 hover:bg-white/10 focus:outline-none focus-visible:ring"
        >
          <Bell className="h-5 w-5 text-slate-300" />
          <span className="sr-only">View notifications</span>
        </button>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 text-xs font-semibold uppercase text-white">
            NH
          </div>
          <div className="text-sm">
            <p className="font-semibold text-white">Nora Hariri</p>
            <p className="text-xs text-slate-400">Lead Architect</p>
          </div>
        </div>
      </div>
    </header>
  );
}
