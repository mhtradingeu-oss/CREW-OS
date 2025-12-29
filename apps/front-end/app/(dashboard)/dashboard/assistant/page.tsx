"use client";

import { useEffect, useState } from "react";
import { assistantChat } from "@/lib/api/ai-brain";
import { listBrands } from "@/lib/api/brand";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api/client";
import { PermissionGuard } from "@/components/layout/permission-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AssistantPage() {
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<{ role: string; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<any[]>([]);
  const [brandId, setBrandId] = useState<string | undefined>(undefined);
  const [scope, setScope] = useState<string>("global");
  const quickPrompts = [
    "Summarize current pricing risks",
    "Draft a campaign idea for this month",
    "Highlight inventory issues for barbershop kits",
  ];

  useEffect(() => {
    listBrands()
      .then((r) => setBrands(r.data))
      .catch(() => {});
  }, []);

  const send = async () => {
    if (!message) return;
    try {
      setLoading(true);
      setHistory((h) => [...h, { role: "user", content: message }]);
      const res = await assistantChat({ message, brandId, scope });
      const reply = (res as any)?.reply ?? JSON.stringify(res);
      setHistory((h) => [...h, { role: "assistant", content: reply }]);
      setMessage("");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PermissionGuard required="ai:run">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">AI Assistant</h1>
            <p className="text-sm text-muted-foreground">
              Scope-aware operator that follows brand tone and RBAC. Use quick prompts or craft your
              own.
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <select
              className="rounded-md border px-3 py-2 text-sm"
              value={brandId ?? ""}
              onChange={(e) => setBrandId(e.target.value || undefined)}
            >
              <option value="">All brands</option>
              {brands.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <select
              className="rounded-md border px-3 py-2 text-sm"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
            >
              <option value="global">Global</option>
              <option value="pricing">Pricing</option>
              <option value="crm">CRM</option>
              <option value="marketing">Marketing</option>
            </select>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-sm text-muted-foreground">Conversation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border bg-muted/30 p-3 h-64 overflow-y-auto space-y-3 text-sm">
              {history.length === 0 ? (
                <div className="text-muted-foreground">Start chatting with the assistant.</div>
              ) : (
                history.map((m, idx) => (
                  <div
                    key={idx}
                    className={`max-w-3xl rounded-md px-3 py-2 ${m.role === "assistant" ? "bg-primary/5 text-primary" : "bg-background text-foreground border"}`}
                  >
                    <div className="text-[11px] uppercase text-muted-foreground">{m.role}</div>
                    <div>{m.content}</div>
                  </div>
                ))
              )}
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {quickPrompts.map((prompt) => (
                <Button key={prompt} variant="outline" size="sm" onClick={() => setMessage(prompt)}>
                  {prompt}
                </Button>
              ))}
            </div>
            <div className="space-y-2">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask anything"
                rows={3}
              />
              <Button onClick={send} disabled={loading || !message}>
                {loading ? "Sending..." : "Send"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}
