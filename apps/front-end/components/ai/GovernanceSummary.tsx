import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, CheckCircle2, AlertTriangle } from "lucide-react";

const risks = [
  { label: "Model drift", level: "Low" },
  { label: "Policy gap", level: "Medium" },
  { label: "Audit overdue", level: "High" },
];

const approvals = [
  { label: "Policy Board", state: "Approved" },
  { label: "Security", state: "Pending" },
  { label: "Compliance", state: "Approved" },
];

const auditSummary = {
  lastAudit: "2025-11-30",
  nextAudit: "2026-05-30",
  status: "In Progress",
};

const riskColor = {
  Low: "bg-green-100 text-green-800",
  Medium: "bg-yellow-100 text-yellow-800",
  High: "bg-red-100 text-red-800",
};

export function GovernanceSummary() {
  return (
    <Card className="w-full max-w-md border-muted/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-primary" /> Governance Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div>
          <div className="font-medium text-sm mb-1">Risk Indicators</div>
          <ul className="space-y-1">
            {risks.map((risk) => (
              <li key={risk.label} className="flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span>{risk.label}</span>
                <Badge className={riskColor[risk.level] + " text-xs ml-2"}>{risk.level}</Badge>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="font-medium text-sm mb-1">Approval States</div>
          <ul className="space-y-1">
            {approvals.map((a) => (
              <li key={a.label} className="flex items-center gap-2 text-sm">
                {a.state === "Approved" ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                )}
                <span>{a.label}</span>
                <Badge variant={a.state === "Approved" ? "default" : "outline"} className="text-xs ml-2">
                  {a.state}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="font-medium text-sm mb-1">Audit Summary</div>
          <div className="text-xs text-muted-foreground">
            Last audit: <span className="font-medium text-foreground">{auditSummary.lastAudit}</span><br />
            Next audit: <span className="font-medium text-foreground">{auditSummary.nextAudit}</span><br />
            Status: <Badge className="ml-1 text-xs" variant="outline">{auditSummary.status}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
