import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";

export type OfficeZone = {
  id: string;
  title: string;
  description: string;
  status?: string;
  accent?: string;
};

export function VirtualOfficeMap({ zones }: { zones: OfficeZone[] }) {
  return (
    <Card className="h-full border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">Office Map</CardTitle>
        <p className="text-sm text-muted-foreground">2D layout of the Virtual HQ zones.</p>
      </CardHeader>
      <CardContent>
        <div className="grid h-full min-h-[320px] grid-cols-6 gap-3 md:grid-cols-6 sm:grid-cols-4">
          {zones.map((zone: typeof zones[number]) => (
            <div
              key={zone.id}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm transition hover:-translate-y-1 hover:border-primary/70 hover:shadow-primary/20"
              style={{ gridColumn: zone.id === "lobby" ? "span 3" : zone.id === "meeting" ? "span 3" : "span 2" }}
              title={`${zone.title} — ${zone.description}`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-50">{zone.title}</p>
                {zone.status ? (
                  <Badge variant="outline" className="border-white/20 text-[11px] text-white">
                    {zone.status}
                  </Badge>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-slate-400">{zone.description}</p>
              <div className="mt-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                <span className="h-2 w-2 rounded-full" style={{ background: zone.accent ?? "#6366f1" }} />
                {zone.accent ?? "linked"}
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/5 opacity-0 group-hover:opacity-60" />
              <div className="pointer-events-none absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-gradient-to-tr from-primary/20 via-transparent to-transparent blur-2xl group-hover:animate-pulse" />
              <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[10px] uppercase tracking-wide text-white/80 opacity-0 transition group-hover:opacity-100">
                <Info className="h-3 w-3" />
                Hover for context
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
