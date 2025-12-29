import { createInsight } from "../../db/repositories/ai-insight.repository.js";
import { runAIPipeline } from "../pipeline/pipeline-runner.js";
import { runEngine as runGovernanceEngine } from "../engines/governance.engine.js";
import { PLAYBOOKS } from "../playbooks/index.js";
import { safeTruncate } from "../pipeline/pipeline-utils.js";
import type { EngineRunOptions } from "../engines/engine-types.js";
import type {
  AutonomyExecutionResult,
  AutonomyGovernanceCheck,
  AutonomyTask,
} from "./autonomy.types.js";

function normalizeNextAction(output: unknown): string | null {
  if (!output || typeof output !== "object") return null;
  const data = output as Record<string, unknown>;
  if (typeof data.nextAction === "string") return data.nextAction;
  if (Array.isArray(data.recommendations) && data.recommendations.length && typeof data.recommendations[0] === "string") {
    return data.recommendations[0];
  }
  if (typeof data.summary === "string") return data.summary;
  return null;
}

function extractBrandId(task: AutonomyTask, fallback?: string): string | undefined {
  const candidate = task.inputs.brandId ?? task.inputs.brand_id ?? task.inputs.brand ?? fallback ?? task.actor?.brandId;
  return typeof candidate === "string" ? candidate : undefined;
}

export function evaluatePlaybookGuardrail(task: AutonomyTask): AutonomyGovernanceCheck | null {
  if (!task.playbookId) return null;
  const playbook = PLAYBOOKS[task.playbookId];
  if (!playbook) return null;

  const text = `${task.goal} ${String(task.inputs?.action ?? "")}`.toLowerCase();
  const violations = playbook.forbiddenActions.filter((rule) => text.includes(rule.split(" ")[0]?.toLowerCase() ?? ""));

  if (violations.length) {
    return {
      safeToProceed: false,
      violations,
      requiredApprovals: playbook.approvalRules,
      notes: `Playbook ${playbook.id} blocked action due to forbidden pattern`,
    };
  }

  if (task.requiresApproval) {
    return {
      safeToProceed: false,
      violations: [],
      requiredApprovals: playbook.approvalRules,
      notes: `Task ${task.taskId} requires approval before execution`,
    };
  }

  return {
    safeToProceed: true,
    violations: [],
    requiredApprovals: playbook.approvalRules,
  };
}

function mergeGovernanceChecks(
  fromPlaybook: AutonomyGovernanceCheck | null,
  fromEngine: AutonomyGovernanceCheck | undefined,
): AutonomyGovernanceCheck | undefined {
  if (!fromEngine && !fromPlaybook) return undefined;
  const combined: AutonomyGovernanceCheck = {
    safeToProceed: Boolean(fromEngine?.safeToProceed ?? fromPlaybook?.safeToProceed ?? true),
    violations: [...(fromPlaybook?.violations ?? []), ...(fromEngine?.violations ?? [])],
    requiredApprovals: [...(fromPlaybook?.requiredApprovals ?? []), ...(fromEngine?.requiredApprovals ?? [])],
    notes: fromEngine?.notes ?? fromPlaybook?.notes,
  };

  if (fromEngine && fromEngine.safeToProceed === false) {
    combined.safeToProceed = false;
  }
  if (fromPlaybook && fromPlaybook.safeToProceed === false) {
    combined.safeToProceed = false;
  }

  return combined;
}

export async function executeAutonomyTask(
  task: AutonomyTask,
  options?: { actorOptions?: EngineRunOptions; skipGovernance?: boolean; simulateOnly?: boolean },
): Promise<{ result: AutonomyExecutionResult; governance?: AutonomyGovernanceCheck }> {
  const brandId = extractBrandId(task, options?.actorOptions?.brandId);
  const playbookGuard = evaluatePlaybookGuardrail(task);

  if (playbookGuard && !playbookGuard.safeToProceed && !options?.skipGovernance) {
    return {
      governance: playbookGuard,
      result: {
        success: false,
        taskId: task.taskId,
        engineOutput: playbookGuard,
        nextAction: playbookGuard.notes ?? "Requires approval",
        pipeline: null,
        contexts: undefined,
      },
    };
  }

  const governanceEngineCheck = options?.skipGovernance
    ? undefined
    : await runGovernanceEngine(
        { brandId: brandId ?? task.actor?.brandId ?? "", action: task.goal },
        {
          brandId: brandId ?? (task.actor?.brandId ?? undefined),
          tenantId: task.actor?.tenantId ?? undefined,
          actor: options?.actorOptions?.actor ?? task.actor,
          task: task.goal,
          dryRun: task.requiresApproval,
          includeEmbeddings: options?.actorOptions?.includeEmbeddings,
        },
      );

  const governance = mergeGovernanceChecks(playbookGuard, governanceEngineCheck);

  if (governance && !governance.safeToProceed) {
    return {
      governance,
      result: {
        success: false,
        taskId: task.taskId,
        engineOutput: governance,
        nextAction: governance.notes ?? "Await human approval",
        pipeline: null,
        contexts: undefined,
      },
    };
  }

  if (options?.simulateOnly) {
    return {
      governance,
      result: {
        success: true,
        taskId: task.taskId,
        engineOutput: { simulated: true, scenario: task.scenario, playbook: task.playbookId },
        nextAction: task.goal,
        pipeline: null,
        contexts: undefined,
      },
    };
  }

  const pipeline = await runAIPipeline({
    agentId: task.agentId,
    task: { input: task.inputs, message: task.goal },
    actor: options?.actorOptions?.actor ?? task.actor,
    brandId,
    tenantId: task.actor?.tenantId ?? options?.actorOptions?.tenantId,
    includeEmbeddings: options?.actorOptions?.includeEmbeddings ?? true,
    dryRun: options?.actorOptions?.dryRun ?? false,
  });

  const result: AutonomyExecutionResult = {
    success: pipeline.success,
    taskId: task.taskId,
    engineOutput: pipeline.output,
    nextAction: normalizeNextAction(pipeline.output),
    pipeline,
    contexts: pipeline.contexts,
  };

  await createInsight({
    brandId: brandId ?? null,
    os: "autonomy",
    entityType: "autonomy-task",
    entityId: task.taskId,
    summary: `Autonomy task ${task.goal}`,
    details: safeTruncate({
      task,
      governance,
      pipeline: {
        success: pipeline.success,
        agent: pipeline.agent?.name,
        outputPreview: pipeline.output,
        logs: pipeline.logs,
      },
    }, 3800),
  });

  return { result, governance };
}
