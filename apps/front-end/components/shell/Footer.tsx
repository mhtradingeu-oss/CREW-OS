// Server Component: Footer
// Architectural: Provides global footer for app shell (read-only, no logic).

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/10 bg-slate-950 px-6 py-3 text-xs text-slate-400 flex items-center justify-between">
      <div>
        <span>MH-OS SUPERAPP</span> <span className="mx-2">|</span> <span>v1.0.0</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded bg-emerald-900/60 px-2 py-1 text-emerald-300 font-semibold uppercase tracking-wider">AI-Governed System</span>
        <a href="/governance/audit" className="underline hover:text-white">Audit Log</a>
        <span className="hidden md:inline">Governance enforced</span>
      </div>
    </footer>
  );
}
