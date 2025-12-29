import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/shell/info-tooltip";

type KpiCardProps = {
  title: string;
  value: string;
  hint?: string;
  trend?: string;
  icon?: ReactNode;
};

const KpiCard = ({ title, value, hint, trend, icon }: KpiCardProps) => {
  return (
    <Card className="rounded-2xl border border-white/5 bg-white/5/80 shadow-lg shadow-black/30">
      <CardHeader className="flex items-center justify-between gap-2">
        <CardTitle className="text-xs uppercase tracking-[0.3em] text-slate-400">{title}</CardTitle>
        {hint ? <InfoTooltip content={hint} /> : null}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4">
          {icon && (
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-slate-100">
              {icon}
            </div>
          )}
          <div>
            <p className="text-3xl font-semibold tracking-tight text-white">{value}</p>
            {trend && <p className="text-xs uppercase tracking-[0.4em] text-slate-400">{trend}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KpiCard;
