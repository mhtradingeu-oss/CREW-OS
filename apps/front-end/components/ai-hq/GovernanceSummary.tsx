import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { ApprovalBadge } from '@/components/governance/ApprovalBadge';
import { RiskIndicator } from '@/components/governance/RiskIndicator';

// GovernanceSummary: Shows risk, approval, and audit summary
export function GovernanceSummary() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold text-white">Governance Overview</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="text-slate-400">Risk:</span>
          <RiskIndicator level="medium" explanation="AI systems require periodic review." />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400">Approval:</span>
          <ApprovalBadge status="approved" />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400">Audit:</span>
          <span className="text-xs text-slate-300">Last audit: 2025-12-01 by AI Orchestrator</span>
        </div>
      </CardContent>
    </Card>
  );
}
