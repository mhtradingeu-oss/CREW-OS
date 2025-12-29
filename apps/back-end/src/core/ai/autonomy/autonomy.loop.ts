import type { PipelineActor } from "../pipeline/pipeline-types.js";
import { executeAutonomyTask } from "./autonomy.executor.js";
import { planAutonomyTasks } from "./autonomy.planner.js";
import { runAutonomyDetectors } from "./autonomy.detectors.js";
import type { AutonomyCycleResult, AutonomyTask } from "./autonomy.types.js";

export type AutonomyLoopOptions = {
  actor?: PipelineActor;
  includeEmbeddings?: boolean;
  dryRun?: boolean;
  autoExecute?: boolean;
};

export async function runAutonomyLoop(options?: AutonomyLoopOptions): Promise<AutonomyCycleResult> {
  const detections = await runAutonomyDetectors();
  const plan = planAutonomyTasks(detections, options?.actor);

  const executed = [] as AutonomyCycleResult["executed"];
  const queued = [] as AutonomyTask[];
  const blocked = [] as AutonomyTask[];
  const pendingApproval = [] as AutonomyTask[];
  const completed = new Set<string>();

  for (const task of plan.tasks) {
    if (task.requiresApproval) {
      pendingApproval.push(task);
      continue;
    }

    const unmetDependencies = (task.dependencies ?? []).filter((dep) => !completed.has(dep));
    if (unmetDependencies.length) {
      queued.push(task);
      continue;
    }

    if (options?.autoExecute === false) {
      queued.push(task);
      continue;
    }

    const actorTenant = typeof task.actor?.tenantId === "string" ? task.actor.tenantId : undefined;
    const optionTenant = typeof options?.actor?.tenantId === "string" ? options.actor.tenantId : undefined;

    const { result, governance } = await executeAutonomyTask(task, {
      actorOptions: {
        actor: options?.actor,
        includeEmbeddings: options?.includeEmbeddings,
        dryRun: options?.dryRun,
        brandId: (task.inputs.brandId as string | undefined) ?? (task.actor?.brandId ?? undefined),
        tenantId: actorTenant ?? optionTenant,
      },
    });

    if (governance && governance.safeToProceed === false) {
      blocked.push({ ...task, governance, result, status: "BLOCKED" });
      continue;
    }

    executed.push(result);
    completed.add(task.taskId);
  }

  return {
    detections,
    planned: plan.tasks,
    executed,
    queued,
    blocked,
    pendingApproval,
    playbooksUsed: plan.playbooksUsed,
    scenariosUsed: plan.scenariosUsed,
  };
}
