import { Badge, Button, Tooltip, Card, CardHeader, CardTitle, CardContent } from '@/components/ui/index.ts';
import { GovernanceBanner } from '@/components/governance/GovernanceBanner.tsx';
import { PageHeader } from '@/components/shell/page-header.tsx';

import { PageLayout } from '@/components/shell/PageLayout.tsx';
import { Check, MinusCircle } from 'lucide-react';

// PricingCard: Enterprise-grade plan card
function PricingCard({ plan }: { plan: any }) {
  return (
    <Card className="flex flex-col gap-3 min-h-[340px]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-xl font-bold text-white">{plan.name}</CardTitle>
          <Badge variant={plan.governanceBadge.variant}>{plan.governanceBadge.label}</Badge>
        </div>
        <p className="text-slate-400 text-sm mt-1">{plan.description}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="text-2xl font-semibold text-white">{plan.price}</div>
        <ul className="mt-2 mb-4 space-y-1 text-sm text-slate-300">
          {plan.features.map((f: string) => (
            <li key={f} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-400" />
              {f}
            </li>
          ))}
        </ul>
        <Tooltip content="Upgrades are disabled in V1 (read-only)">
          <Button variant="secondary" disabled className="w-full cursor-not-allowed">
            Upgrade disabled in V1
          </Button>
        </Tooltip>
      </CardContent>
    </Card>
  );
}

// PricingGrid: Responsive grid of PricingCards
function PricingGrid({ plans }: { plans: any[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {plans.map((plan) => (
        <PricingCard key={plan.name} plan={plan} />
      ))}
    </div>
  );
}

// ComparisonTable: Feature vs Plan matrix
function ComparisonTable({ features, plans }: { features: string[]; plans: any[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card mt-8">
      <table className="min-w-full text-sm text-slate-200">
        <thead>
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-white">Feature</th>
            {plans.map((plan) => (
              <th key={plan.name} className="px-4 py-3 text-center font-semibold text-white">{plan.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((feature) => (
            <tr key={feature} className="border-t border-border">
              <td className="px-4 py-2 text-slate-300">{feature}</td>
              {plans.map((plan) => (
                <td key={plan.name} className="px-4 py-2 text-center">
                  {plan.features.includes(feature) ? (
                    <Check className="inline h-5 w-5 text-emerald-400" aria-label="Included" />
                  ) : (
                    <MinusCircle className="inline h-5 w-5 text-slate-600" aria-label="Not included" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Page: Plans & Pricing
export default function PricingPage() {
  // Mock plans and features
  const plans = [
    {
      name: 'Standard',
      description: 'Core features for growing teams',
      price: '$49/mo',
      features: ['User Management', 'Basic Analytics', 'Email Support'],
      governanceBadge: { label: 'Execution Restricted', variant: 'warning' },
    },
    {
      name: 'Professional',
      description: 'Advanced controls and integrations',
      price: '$149/mo',
      features: ['User Management', 'Advanced Analytics', 'Priority Support', 'API Access'],
      governanceBadge: { label: 'AI Governance Included', variant: 'info' },
    },
    {
      name: 'Enterprise',
      description: 'Full platform access and compliance',
      price: 'Contact Us',
      features: [
        'User Management',
        'Advanced Analytics',
        'Priority Support',
        'API Access',
        'Custom Integrations',
        'Audit Logging',
      ],
      governanceBadge: { label: 'Enterprise Ready', variant: 'success' },
    },
  ];
  const allFeatures = [
    'User Management',
    'Basic Analytics',
    'Advanced Analytics',
    'Email Support',
    'Priority Support',
    'API Access',
    'Custom Integrations',
    'Audit Logging',
  ];

  return (
    <PageLayout footer={<span>MH-OS SUPERAPP v1.0.0 &mdash; Governance enforced</span>}>
      <GovernanceBanner />
      <PageHeader
        title="Plans & Pricing"
        description="Overview of available plans and capabilities"
      />
      <PricingGrid plans={plans} />
      <ComparisonTable features={allFeatures} plans={plans} />
    </PageLayout>
  );
}

