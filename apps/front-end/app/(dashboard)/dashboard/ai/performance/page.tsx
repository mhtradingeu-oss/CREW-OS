"use client";

import { useEffect, useState } from "react";
import { fetchEngineHealth, fetchPerformanceMetrics } from "@/lib/api/ai-monitoring";
import { apiErrorMessage } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function AIPerformancePage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [health, setHealth] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [m, h] = await Promise.all([fetchPerformanceMetrics(), fetchEngineHealth()]);
        setMetrics(m ?? null);
        setHealth(h ?? []);
      } catch (err) {
        toast.error(apiErrorMessage(err));
      }
    };
    void load();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">AI Performance Metrics</h1>
        <p className="text-sm text-muted-foreground">Latency, throughput, and engine health.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Avg Latency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{metrics?.avgLatency ?? 0}ms</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{metrics?.totalRequests ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{metrics?.errors ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Fallbacks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{metrics?.fallbacks ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Engine Health</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2">
          {health.slice(0, 10).map((item) => (
            <div key={item.id} className="rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="font-medium">{item.engine ?? item.namespace ?? "engine"}</div>
                <Badge variant={item.status === "ERROR" ? "secondary" : "outline"}>{item.status}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">{item.riskLevel ?? "LOW"}</div>
            </div>
          ))}
          {!health.length && <div className="text-sm text-muted-foreground">No health signals yet.</div>}
        </CardContent>
      </Card>
    </div>
  );
}
