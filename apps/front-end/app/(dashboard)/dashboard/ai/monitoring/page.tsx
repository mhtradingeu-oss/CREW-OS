"use client";

import { useEffect, useState } from "react";
import {
  fetchAgentActivity,
  fetchEngineHealth,
  fetchPerformanceMetrics,
  fetchSystemAlerts,
  fetchTokenUsage,
} from "@/lib/api/ai-monitoring";
import { apiErrorMessage } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function AIMonitoringPage() {
  const [loading, setLoading] = useState(true);
  const [engineHealth, setEngineHealth] = useState<any[]>([]);
  const [agentActivity, setAgentActivity] = useState<any[]>([]);
  const [tokenUsage, setTokenUsage] = useState<Record<string, any>>({});
  const [performance, setPerformance] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  const load = async () => {
    try {
      setLoading(true);
      const [health, activity, usage, perf, sys] = await Promise.all([
        fetchEngineHealth(),
        fetchAgentActivity(),
        fetchTokenUsage(),
        fetchPerformanceMetrics(),
        fetchSystemAlerts(),
      ]);
      setEngineHealth(health ?? []);
      setAgentActivity(activity ?? []);
      setTokenUsage(usage ?? {});
      setPerformance(perf ?? null);
      setAlerts(sys ?? []);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const renderEngineHealth = () => (
    <Card>
      <CardHeader>
        <CardTitle>Engine Health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {engineHealth.slice(0, 8).map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
            <div className="flex flex-col gap-1">
              <div className="font-medium">{item.engine ?? item.namespace ?? "engine"}</div>
              <div className="text-xs text-muted-foreground">{item.status}</div>
            </div>
            <Badge variant={item.status === "ERROR" ? "destructive" : "outline"}>{item.riskLevel ?? "LOW"}</Badge>
          </div>
        ))}
        {!engineHealth.length && <div className="text-sm text-muted-foreground">No events yet.</div>}
      </CardContent>
    </Card>
  );

  const renderAgentActivity = () => (
    <Card>
      <CardHeader>
        <CardTitle>Agent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {agentActivity.slice(0, 8).map((item) => (
          <div key={item.id} className="rounded-md border p-3">
            <div className="flex items-center justify-between">
              <div className="font-medium">{item.agentName ?? item.namespace ?? "agent"}</div>
              <Badge variant={item.status === "ERROR" ? "destructive" : "outline"}>{item.status}</Badge>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Latency: {item.latencyMs ?? "-"}ms · Tokens: {item.totalTokens ?? "-"}
            </div>
            {item.errorMessage && (
              <div className="mt-2 text-xs text-rose-500">{item.errorMessage}</div>
            )}
          </div>
        ))}
        {!agentActivity.length && <div className="text-sm text-muted-foreground">No activity captured.</div>}
      </CardContent>
    </Card>
  );

  const renderTokenUsage = () => (
    <Card>
      <CardHeader>
        <CardTitle>Token Usage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {Object.entries(tokenUsage).map(([agent, stats]) => (
          <div key={agent} className="rounded-md border p-3">
            <div className="font-medium">{agent}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Today: {stats.dayTokens ?? 0} tokens (${(stats.dayCost ?? 0).toFixed?.(4) ?? 0})
            </div>
            <div className="text-xs text-muted-foreground">
              Month: {stats.monthTokens ?? 0} tokens (${(stats.monthCost ?? 0).toFixed?.(4) ?? 0})
            </div>
          </div>
        ))}
        {!Object.keys(tokenUsage).length && <div className="text-sm text-muted-foreground">No usage yet.</div>}
      </CardContent>
    </Card>
  );

  const renderPerformance = () => (
    <Card>
      <CardHeader>
        <CardTitle>Performance Metrics</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
        <div className="rounded-md border p-3">
          <div className="text-xs text-muted-foreground">Avg latency</div>
          <div className="text-lg font-semibold">{performance?.avgLatency ?? 0}ms</div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-xs text-muted-foreground">Requests</div>
          <div className="text-lg font-semibold">{performance?.totalRequests ?? 0}</div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-xs text-muted-foreground">Errors</div>
          <div className="text-lg font-semibold">{performance?.errors ?? 0}</div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-xs text-muted-foreground">Fallbacks</div>
          <div className="text-lg font-semibold">{performance?.fallbacks ?? 0}</div>
        </div>
      </CardContent>
    </Card>
  );

  const renderAlerts = () => (
    <Card>
      <CardHeader>
        <CardTitle>System Alerts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {alerts.slice(0, 8).map((alert) => (
          <div key={alert.id} className="rounded-md border p-3">
            <div className="flex items-center justify-between">
              <div className="font-medium">{alert.status}</div>
              <Badge variant={"outline"}>{alert.riskLevel ?? "MEDIUM"}</Badge>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{alert.namespace ?? alert.agentName}</div>
          </div>
        ))}
        {!alerts.length && <div className="text-sm text-muted-foreground">No alerts.</div>}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, idx) => (
          <Skeleton key={idx} className="h-44 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">AI Monitoring Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Health, usage, and reliability snapshots across AI agents.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {renderEngineHealth()}
        {renderPerformance()}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {renderAgentActivity()}
        {renderTokenUsage()}
      </div>
      <div>{renderAlerts()}</div>
    </div>
  );
}
