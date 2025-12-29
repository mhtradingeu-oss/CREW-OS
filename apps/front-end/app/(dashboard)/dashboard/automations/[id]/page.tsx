"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAutomation, runAutomation } from "@/lib/api/automations";
import { apiErrorMessage } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export default function AutomationDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["automation", id],
    queryFn: () => getAutomation(id),
    enabled: Boolean(id),
  });

  const runMutation = useMutation({
    mutationFn: () => runAutomation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["automation", id] }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner className="h-4 w-4" />
        Loading automation...
      </div>
    );
  }

  if (isError || !data) {
    return <div className="text-sm text-destructive">Error: {apiErrorMessage(error)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground">
            <Link href="/dashboard/automations" className="hover:underline">
              Automations
            </Link>{" "}
            / {data.name}
          </div>
          <h1 className="text-xl font-semibold">{data.name}</h1>
          <p className="text-sm text-muted-foreground">{data.description ?? "No description"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => runMutation.mutate()}
            disabled={runMutation.isLoading}
          >
            {runMutation.isLoading ? "Running..." : "Run now"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigator?.clipboard?.writeText(JSON.stringify(data.actions, null, 2))}
          >
            Copy actions
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4 space-y-2">
          <div className="text-sm font-semibold">Trigger</div>
          <div className="text-sm">Type: {data.triggerType}</div>
          {data.triggerEvent && <div className="text-sm">Event: {data.triggerEvent}</div>}
          {data.triggerConfig && (
            <pre className="rounded-md bg-muted p-3 text-xs">
              {JSON.stringify(data.triggerConfig, null, 2)}
            </pre>
          )}
        </Card>
        <Card className="p-4 space-y-2">
          <div className="text-sm font-semibold">Conditions</div>
          <pre className="rounded-md bg-muted p-3 text-xs">
            {JSON.stringify(data.conditionConfig ?? {}, null, 2)}
          </pre>
        </Card>
        <Card className="p-4 space-y-2 md:col-span-2">
          <div className="text-sm font-semibold">Actions</div>
          <pre className="rounded-md bg-muted p-3 text-xs">
            {JSON.stringify(data.actions, null, 2)}
          </pre>
        </Card>
      </div>
    </div>
  );
}
