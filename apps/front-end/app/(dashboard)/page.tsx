// Server Component: Dashboard Page (Read-Only, V1)
// Follows enterprise design blueprint: KPI cards, risk banner, audit activity, quick links.


import { Button, Badge, Card, CardHeader, CardTitle, CardContent, Tooltip } from '@/components/ui';
import { PageHeader } from '@/components/shell/PageHeader';
import { PageLayout } from '@/components/shell/PageLayout';
import { GovernanceBanner } from '@/components/governance/GovernanceBanner';
import { ApprovalBadge } from '@/components/governance/ApprovalBadge';
import { RiskIndicator } from '@/components/governance/RiskIndicator';
import { AuditTimeline as GovernanceAuditTimeline } from '@/components/governance/AuditTimeline';
import KpiCard from '@/components/shell/KpiCard';
import AuditTimeline from '@/components/shell/AuditTimeline';
import RiskBanner from '@/components/shell/RiskBanner';

// UX GUIDELINES: Use PageLayout for all admin pages. PageHeader for title/desc/status. Consistent spacing, no visual noise. Footer for governance/version if needed.
export default function DashboardPage() {
  // Mock data
  const kpis = [
    { label: 'Active Brands', value: 12, status: 'success', badge: 'OK' },
    { label: 'Total Users', value: 1024, status: 'info', badge: 'Growing' },
    { label: 'Revenue', value: '$2.4M', status: 'info', badge: 'FY25' },
    { label: 'Open Governance Actions', value: 3, status: 'warning', badge: 'Review' },
    { label: 'System Risk Level', value: 'Medium', status: 'warning', badge: 'Risk' },
  ];
  const auditItems = [
    { time: '12:04', user: 'Nora Hariri', action: 'Approved pricing update', target: 'Brand A' },
    { time: '11:47', user: 'AI Orchestrator', action: 'Updated governance policy' },
    { time: '10:33', user: 'System', action: 'Flagged risk', target: 'Loyalty module' },
  ];
  const riskLevel = 'medium';
  const riskMessage = '2 modules require governance review.';

  return (
    <PageLayout footer={<span>MH-OS SUPERAPP v1.0.0 &mdash; Governance enforced</span>}>
      {/* Governance Visual Language Example Usage */}
      <GovernanceBanner />
      <PageHeader
        title="Dashboard"
        description="System overview and governance status"
        statusBadge={{ label: 'Operational', variant: 'success' }}
        right={<>
          <ApprovalBadge status="approved" />
          <RiskIndicator level="medium" explanation="Some modules require review." />
        </>}
      />
      {/* KPI Cards (with Badge example) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="flex flex-col gap-2 min-h-[120px] group hover:bg-slate-800 transition-colors duration-150">
            <CardHeader className="flex flex-row items-center gap-2 pb-0">
              <CardTitle className="text-xs uppercase tracking-wider text-slate-400 flex-1">{kpi.label}</CardTitle>
              {kpi.badge && <Badge variant={kpi.status as any}>{kpi.badge}</Badge>}
            </CardHeader>
            <CardContent className="pt-2">
              <span className="text-3xl font-bold text-white">{kpi.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Risk Banner (conditional) */}
      <RiskBanner riskLevel={riskLevel} message={riskMessage} />
      {/* Recent Governance Activity (AuditTimeline) */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-2">Recent Governance Activity</h2>
        <GovernanceAuditTimeline items={auditItems.map(i => ({
          time: i.time,
          actor: i.user,
          action: i.action,
          context: i.target,
        }))} />
      </section>
      {/* Quick Links (with Button and Tooltip example) */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-2">Quick Links</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Tooltip content="Go to Brands">
            <Button asChild variant="secondary">
              <a href="/brands">Brands</a>
            </Button>
          </Tooltip>
          <Tooltip content="Go to Products">
            <Button asChild variant="secondary">
              <a href="/products">Products</a>
            </Button>
          </Tooltip>
          <Tooltip content="Go to CRM">
            <Button asChild variant="secondary">
              <a href="/crm">CRM</a>
            </Button>
          </Tooltip>
          <Tooltip content="Go to AI HQ">
            <Button asChild variant="secondary">
              <a href="/ai-hq">AI HQ</a>
            </Button>
          </Tooltip>
        </div>
      </section>
    </PageLayout>
  );
}
