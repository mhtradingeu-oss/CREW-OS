"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { createAutomation } from "@/lib/api/automations";
import { apiErrorMessage } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function CreateAutomationPageClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState<"event" | "schedule">("event");
  const [triggerEvent, setTriggerEvent] = useState("pricing.updated");
  const [actionsJson, setActionsJson] = useState(
    '[{"type":"notification","params":{"title":"Alert","message":"Rule fired"}}]',
  );
  const [conditionsJson, setConditionsJson] = useState(
    '{"all":[{"path":"payload.brandId","op":"eq","value":"brand-id"}]}',
  );
  const [description, setDescription] = useState("");
  const mutation = useMutation({
    mutationFn: () =>
      createAutomation({
        name,
        description,
        triggerType,
        triggerEvent: triggerType === "event" ? triggerEvent : undefined,
        conditionConfig: conditionsJson ? JSON.parse(conditionsJson) : undefined,
        actions: actionsJson ? JSON.parse(actionsJson) : [],
        isActive: true,
      }),
    onSuccess: () => router.push("/dashboard/automations"),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Create Automation</h1>
        <p className="text-sm text-muted-foreground">
          Wire events to actions and keep AI in the loop.
        </p>
      </div>
      <Card className="space-y-4 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Pricing anomaly alert"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Trigger type</label>
            <div className="flex gap-2">
              <Button
                variant={triggerType === "event" ? "default" : "outline"}
                onClick={() => setTriggerType("event")}
              >
                Event
              </Button>
              <Button
                variant={triggerType === "schedule" ? "default" : "outline"}
                onClick={() => setTriggerType("schedule")}
              >
                Schedule
              </Button>
            </div>
          </div>
          {triggerType === "event" && (
            <div>
              <label className="text-sm font-medium">Event</label>
              <Input
                value={triggerEvent}
                onChange={(e) => setTriggerEvent(e.target.value)}
                placeholder="pricing.updated"
              />
            </div>
          )}
          <div>
            <label className="text-sm font-medium">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notify ops when prices change"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Conditions JSON</label>
          <Textarea
            rows={4}
            value={conditionsJson}
            onChange={(e) => setConditionsJson(e.target.value)}
            className="font-mono"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Actions JSON</label>
          <Textarea
            rows={5}
            value={actionsJson}
            onChange={(e) => setActionsJson(e.target.value)}
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Example:{" "}
            <code>
              [{'{"type":"notification","params":{"title":"Alert","message":"Rule fired"}}'}]
            </code>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => mutation.mutate()} disabled={mutation.isLoading || !name}>
            {mutation.isLoading ? "Creating..." : "Create automation"}
          </Button>
          {mutation.isError && (
            <span className="text-sm text-destructive">{apiErrorMessage(mutation.error)}</span>
          )}
        </div>
      </Card>
    </div>
  );
}
