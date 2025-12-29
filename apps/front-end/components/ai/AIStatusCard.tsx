import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AIStatusCardProps {
  title: string;
  status: "Active" | "Monitoring" | "Disabled";
  governance: string;
  description: string;
}

const statusColor = {
  Active: "bg-green-100 text-green-800",
  Monitoring: "bg-yellow-100 text-yellow-800",
  Disabled: "bg-gray-100 text-gray-500",
};

export function AIStatusCard({ title, status, governance, description }: AIStatusCardProps) {
  return (
    <Card className="w-full max-w-xs shadow-none border border-muted/40">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <Badge className={cn("px-2 py-1 text-xs font-medium rounded", statusColor[status])}>{status}</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Governance:</span>
          <Badge variant="outline" className="text-xs border-primary/40">{governance}</Badge>
        </div>
        <p className="text-sm text-muted-foreground leading-snug">{description}</p>
      </CardContent>
    </Card>
  );
}
