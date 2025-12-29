import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

const readinessScore = 87;
const checklist = [
  { label: "AI Brain operational", checked: true },
  { label: "Governance policies loaded", checked: true },
  { label: "Safety firewall enabled", checked: true },
  { label: "Monitoring active", checked: true },
  { label: "Learning loop configured", checked: false },
];

export function ReadinessPanel() {
  return (
    <Card className="w-full max-w-md border-muted/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          Readiness Score
          <span className="ml-2 text-2xl font-bold text-primary">{readinessScore}%</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ul className="space-y-2">
          {checklist.map((item) => (
            <li key={item.label} className="flex items-center gap-2 text-sm">
              {item.checked ? (
                <CheckCircle2 className="text-green-500 w-4 h-4" />
              ) : (
                <XCircle className="text-gray-400 w-4 h-4" />
              )}
              <span className={item.checked ? "" : "text-muted-foreground"}>{item.label}</span>
            </li>
          ))}
        </ul>
        <Badge variant="destructive" className="w-fit text-xs mt-2">Execution disabled in V1</Badge>
      </CardContent>
    </Card>
  );
}
