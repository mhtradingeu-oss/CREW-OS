"use client";

import { useEffect, useState } from "react";
import { fetchAgentActivity, fetchSystemAlerts } from "@/lib/api/ai-monitoring";
import { apiErrorMessage } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function AISystemLogsPage() {
  const [activity, setActivity] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [act, al] = await Promise.all([fetchAgentActivity(), fetchSystemAlerts()]);
        setActivity(act ?? []);
        setAlerts(al ?? []);
      } catch (err) {
        toast.error(apiErrorMessage(err));
      }
    };
    void load();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">AI System Logs</h1>
        <p className="text-sm text-muted-foreground">Trace recent AI executions and alerts.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {activity.slice(0, 20).map((item) => (
            <div key={item.id} className="rounded-md border p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">{item.agentName ?? item.namespace ?? "agent"}</div>
                <Badge variant={item.status === "ERROR" ? "secondary" : "outline"}>
                  {item.status}
                </Badge>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Run: {item.runId ?? "-"} · Model: {item.model ?? "-"}
              </div>
              {item.errorMessage && (
                <div className="mt-1 text-xs text-rose-500">{item.errorMessage}</div>
              )}
            </div>
          ))}
          {!activity.length && <div className="text-sm text-muted-foreground">No activity recorded.</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {alerts.map((alert) => (
            <div key={alert.id} className="rounded-md border p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">{alert.status}</div>
                <Badge variant="outline">{alert.riskLevel ?? "MEDIUM"}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">{alert.namespace ?? alert.agentName}</div>
            </div>
          ))}
          {!alerts.length && <div className="text-sm text-muted-foreground">No alerts.</div>}
        </CardContent>
      </Card>
    </div>
  );
}
