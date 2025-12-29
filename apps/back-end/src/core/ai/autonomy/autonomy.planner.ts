import { randomUUID } from "crypto";
import type { PipelineActor } from "../pipeline/pipeline-types.js";
import type { PlaybookId } from "../playbooks/types.js";
import type {
  AutonomyDetection,
  AutonomyPlan,
  AutonomySafetyPath,
  AutonomyScenario,
  AutonomyTask,
  AutonomyTaskStatus,
} from "./autonomy.types.js";
import { findScenarioForIssue } from "./scenarios.js";

function taskStatusFromRisk(risk: AutonomyDetection["severity"], path: AutonomySafetyPath): AutonomyTaskStatus {
  if (path === "HIGH_RISK") return "QUEUED";
  return risk === "CRITICAL" ? "QUEUED" : "PENDING";
}

function resolveSafetyPath(detection: AutonomyDetection, scenario: AutonomyScenario): AutonomySafetyPath {
  if (detection.severity === "CRITICAL") return "HIGH_RISK";
  if (detection.severity === "HIGH") return scenario.highRiskActions.length ? "HIGH_RISK" : "SAFE";
  return scenario.safeActions.length ? "SAFE" : "HIGH_RISK";
}

function buildTasksFromScenario(
  detection: AutonomyDetection,
  scenario: AutonomyScenario,
  actor?: PipelineActor,
): AutonomyTask[] {
  const safetyPath = resolveSafetyPath(detection, scenario);
  const actionPlan = safetyPath === "HIGH_RISK" && scenario.highRiskActions.length
    ? scenario.highRiskActions
    : scenario.safeActions;

  const taskIdsByAction = new Map<string, string>();
  const now = new Date().toISOString();
  const tasks: AutonomyTask[] = [];

  for (const action of actionPlan) {
    const taskId = randomUUID();
    taskIdsByAction.set(action.id, taskId);
    const dependencies = (action.dependsOn ?? [])
      .map((dep) => taskIdsByAction.get(dep))
      .filter((depId): depId is string => Boolean(depId));

    tasks.push({
      taskId,
      agentId: action.agentId,
      engine: action.engine,
      goal: action.goal,
      contexts: detection.requiredContexts,
      requiresApproval: action.approvalRequired ?? scenario.approvalRequired ?? safetyPath === "HIGH_RISK",
      inputs: { ...detection.details, ...(action.inputs ?? {}), issueType: detection.type, sourceDetectionId: detection.id },
      dependencies,
      createdAt: now,
      status: dependencies.length ? "QUEUED" : taskStatusFromRisk(detection.severity, safetyPath),
      sourceIssueId: detection.id,
      risk: detection.severity,
      actor,
      scenario: scenario.name,
      playbookId: scenario.playbook,
      safetyPath,
      actionId: action.id,
    });
  }

  return tasks;
}

export function planAutonomyTasks(detections: AutonomyDetection[], actor?: PipelineActor): AutonomyPlan {
  const tasks: AutonomyTask[] = [];
  const scenariosUsed = new Set<string>();
  const playbooksUsed = new Set<PlaybookId>();

  for (const detection of detections) {
    const scenario = findScenarioForIssue(detection.type);
    if (!scenario) {
      continue;
    }

    scenariosUsed.add(scenario.name);
    playbooksUsed.add(scenario.playbook);
    const scenarioTasks = buildTasksFromScenario(detection, scenario, actor);
    tasks.push(...scenarioTasks);
  }

  return {
    tasks,
    createdAt: new Date().toISOString(),
    fromIssues: detections,
    scenariosUsed: Array.from(scenariosUsed),
    playbooksUsed: Array.from(playbooksUsed),
  };
}
