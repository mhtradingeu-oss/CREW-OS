import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "./info-tooltip.tsx";

export function StatCard({
  title,
  value,
  hint,
  meta,
  icon,
}: {
  title: string;
  value: string;
  hint?: string;
  meta?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {hint ? <InfoTooltip content={hint} /> : icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        {meta ? <div className="mt-1 text-xs text-muted-foreground">{meta}</div> : null}
      </CardContent>
    </Card>
  );
}
