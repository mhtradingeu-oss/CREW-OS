import { Badge, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { ApprovalBadge } from '@/components/governance/ApprovalBadge';
import { RiskIndicator } from '@/components/governance/RiskIndicator';

// AIStatusCard: Visualizes an AI subsystem's status and governance
export function AIStatusCard({ system }: { system: any }) {
  return (
    <Card className="flex flex-col gap-2 min-h-[160px]">
      <CardHeader className="flex flex-row items-center gap-2 pb-0">
        <CardTitle className="text-lg font-bold text-white flex-1">{system.name}</CardTitle>
        <Badge variant={system.statusVariant}>{system.status}</Badge>
        <ApprovalBadge status={system.approval} />
      </CardHeader>
      <CardContent className="pt-2">
        <p className="text-slate-300 text-sm mb-2">{system.description}</p>
        <RiskIndicator level={system.risk} explanation={system.riskExplanation} />
      </CardContent>
    </Card>
  );
}
