import { Badge, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

// ReadinessPanel: Shows AI readiness score and checklist
export function ReadinessPanel() {
  const readiness = 87; // static for V1
  const checklist = [
    { label: 'Governance Policy Linked', ok: true },
    { label: 'Audit Logging Enabled', ok: true },
    { label: 'Safety Firewall Active', ok: true },
    { label: 'Learning Loop Ready', ok: false },
    { label: 'Execution (V1 Disabled)', ok: false },
  ];
  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center gap-4">
        <CardTitle className="text-lg font-bold text-white flex-1">AI Readiness</CardTitle>
        <Badge variant="info">{readiness}%</Badge>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {checklist.map((item) => (
            <li key={item.label} className="flex items-center gap-2">
              <span className={item.ok ? 'text-emerald-400' : 'text-slate-500'}>
                {item.ok ? '✔' : '—'}
              </span>
              <span className={item.ok ? '' : 'opacity-60'}>{item.label}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 rounded bg-amber-900/60 text-amber-200 px-3 py-2 text-xs font-semibold">
          Execution is disabled in V1. This is a read-only preview.
        </div>
      </CardContent>
    </Card>
  );
}
