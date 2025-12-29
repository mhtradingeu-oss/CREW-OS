"use client";

import { useEffect, useState } from "react";
import {
  createBannedAction,
  createConstraint,
  createFirewallRule,
  listBannedActions,
  listConstraints,
  listFirewallRules,
} from "@/lib/api/ai-safety";
import { apiErrorMessage } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function AISafetyDashboard() {
  const [rules, setRules] = useState<any[]>([]);
  const [constraints, setConstraints] = useState<any[]>([]);
  const [banned, setBanned] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", matcherValue: "", action: "BLOCK" });
  const [constraintForm, setConstraintForm] = useState({ code: "", restrictedDomains: "" });
  const [bannedForm, setBannedForm] = useState({ code: "", description: "" });

  const load = async () => {
    try {
      const [r, c, b] = await Promise.all([
        listFirewallRules(),
        listConstraints(),
        listBannedActions(),
      ]);
      setRules(r ?? []);
      setConstraints(c ?? []);
      setBanned(b ?? []);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const submitRule = async () => {
    try {
      await createFirewallRule({ ...form, matcherType: "contains", severity: "MEDIUM" });
      toast.success("Firewall rule added");
      setForm({ name: "", matcherValue: "", action: "BLOCK" });
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const submitConstraint = async () => {
    try {
      const restrictedDomains = constraintForm.restrictedDomains
        ? constraintForm.restrictedDomains.split(",").map((s) => s.trim())
        : [];
      await createConstraint({ ...constraintForm, restrictedDomains });
      toast.success("Constraint added");
      setConstraintForm({ code: "", restrictedDomains: "" });
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const submitBanned = async () => {
    try {
      await createBannedAction({ ...bannedForm, severity: "HIGH" });
      toast.success("Banned action added");
      setBannedForm({ code: "", description: "" });
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">AI Safety Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Manage the prompt firewall, safety constraints, and banned actions.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Prompt Firewall</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid gap-2 md:grid-cols-2">
              <Input
                placeholder="Rule name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              <Input
                placeholder="Matcher value"
                value={form.matcherValue}
                onChange={(e) => setForm((f) => ({ ...f, matcherValue: e.target.value }))}
              />
              <select
                className="rounded-md border px-3 py-2 text-sm"
                value={form.action}
                onChange={(e) => setForm((f) => ({ ...f, action: e.target.value }))}
              >
                <option value="BLOCK">Block</option>
                <option value="SANITIZE">Sanitize</option>
                <option value="ALLOW">Allow</option>
              </select>
              <Button onClick={submitRule}>Add Rule</Button>
            </div>
            <div className="space-y-2">
              {rules.map((rule) => (
                <div key={rule.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{rule.name}</div>
                    <Badge variant={rule.action === "BLOCK" ? "destructive" : "outline"}>
                      {rule.action}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {rule.matcherType}: {rule.matcherValue}
                  </div>
                </div>
              ))}
              {!rules.length && <div className="text-sm text-muted-foreground">No rules yet.</div>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Safety Constraints</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Input
              placeholder="Constraint code"
              value={constraintForm.code}
              onChange={(e) => setConstraintForm((f) => ({ ...f, code: e.target.value }))}
            />
            <Textarea
              placeholder="Restricted domains (comma separated)"
              value={constraintForm.restrictedDomains}
              onChange={(e) => setConstraintForm((f) => ({ ...f, restrictedDomains: e.target.value }))}
            />
            <Button onClick={submitConstraint}>Add Constraint</Button>
            <div className="space-y-2">
              {constraints.map((c) => (
                <div key={c.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{c.code}</div>
                    <Badge variant="outline">{c.scope ?? "global"}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{c.description}</div>
                </div>
              ))}
              {!constraints.length && <div className="text-sm text-muted-foreground">No constraints.</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Banned Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid gap-2 md:grid-cols-3">
            <Input
              placeholder="Action code"
              value={bannedForm.code}
              onChange={(e) => setBannedForm((f) => ({ ...f, code: e.target.value }))}
            />
            <Input
              placeholder="Description"
              value={bannedForm.description}
              onChange={(e) => setBannedForm((f) => ({ ...f, description: e.target.value }))}
            />
            <Button onClick={submitBanned}>Add Banned Action</Button>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {banned.map((b) => (
              <div key={b.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{b.code}</div>
                  <Badge variant="destructive">{b.severity ?? "HIGH"}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">{b.description}</div>
              </div>
            ))}
            {!banned.length && <div className="text-sm text-muted-foreground">No banned actions.</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
