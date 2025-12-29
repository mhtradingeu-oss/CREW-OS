import { badRequest, notFound } from "../../http/errors.js";
import type { PipelineActor } from "../pipeline/pipeline-types.js";
import { executeAutonomyTask } from "./autonomy.executor.js";
import { runAutonomyLoop, type AutonomyLoopOptions } from "./autonomy.loop.js";
import type {
  AutonomyCycleResult,
  AutonomyExecutionResult,
  AutonomyPlan,
  AutonomyStatus,
  AutonomyTask,
} from "./autonomy.types.js";
import type { AutonomyTaskStatus } from "./autonomy.types.js";
import {
  findAISuggestions,
  updateAISuggestion,
  createAISuggestion,
} from "../../db/repositories/autonomy.repository.js";

// TODO: PHASE 5 PR-4: The following Maps are in-memory and must be migrated to DB persistence (AISuggestion model)
// pending: status = 'pending', completed: status = 'executed', blocked: status = 'rejected' or 'blocked', running: status = 'approved' or 'running'
class AutonomyService {
  private pending = new Map<string, AutonomyTask>();
  private running = new Map<string, AutonomyTask>();
  private completed = new Map<string, AutonomyTask>();
  private blocked = new Map<string, AutonomyTask>();
  private lastPlan?: AutonomyPlan;
  private lastDetections: AutonomyCycleResult["detections"] = [];
  private lastExecuted: AutonomyExecutionResult[] = [];
  private lastRunAt?: string;
  private globalAutonomyEnabled = true;

  getStatus(): AutonomyStatus {
    return {
      lastRunAt: this.lastRunAt,
      queued: Array.from(this.running.values()),
      running: Array.from(this.running.values()),
      completed: Array.from(this.completed.values()),
      blocked: Array.from(this.blocked.values()),
      pendingApproval: Array.from(this.pending.values()),
      lastDetections: this.lastDetections,
      lastPlan: this.lastPlan,
      globalAutonomyEnabled: this.globalAutonomyEnabled,
      totalPending: this.pending.size,
      totalExecuted: this.completed.size,
      totalRejected: Array.from(this.blocked.values()).filter((t): t is AutonomyTask => t.status === "REJECTED").length,
    };
  }

  async getPending(filters?: {
    severity?: "low" | "medium" | "high";
    brandId?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<AutonomyTask[]> {
    const limit = filters?.limit ?? 20;
    const offset = filters?.offset ?? 0;
    const where: any = { status: "pending" };
    if (filters?.severity) where.riskLevel = { equals: filters.severity.toUpperCase() };
    if (filters?.brandId) where.brandId = { equals: filters.brandId };
    if (filters?.type) where.suggestionType = { equals: filters.type };
    const rows = await findAISuggestions({ where, take: limit, skip: offset, orderBy: { createdAt: "desc" } });
    // Map DB rows to AutonomyTask shape as needed
    return rows.map(row => ({
      taskId: row.id,
      agentId: row.agent,
      goal: row.domain,
      contexts: [],
      engine: row.suggestionType as any,
      requiresApproval: true,
      inputs: JSON.parse(row.inputSnapshotJson ?? '{}'),
      dependencies: [],
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt?.toISOString(),
      status: row.status.toUpperCase() as AutonomyTaskStatus,
      risk: row.riskLevel as any,
      actor: undefined,
      result: undefined,
      scenario: undefined,
      playbookId: undefined,
      safetyPath: undefined,
      actionId: undefined,
    }));
  }

  getPlan(): AutonomyPlan | undefined {
    return this.lastPlan;
  }

  getExecuted(): AutonomyExecutionResult[] {
    return this.lastExecuted;
  }

  getConfig() {
    return {
      globalAutonomyEnabled: this.globalAutonomyEnabled,
      defaultAutonomyLevelPerAgent: "AUTO_LOW_RISK_ONLY" as const,
    };
  }

  setConfig(config: { globalAutonomyEnabled?: boolean }) {
    if (typeof config.globalAutonomyEnabled === "boolean") {
      this.globalAutonomyEnabled = config.globalAutonomyEnabled;
    }
    return this.getConfig();
  }

  async runCycle(options?: AutonomyLoopOptions): Promise<AutonomyCycleResult> {
    const result = await runAutonomyLoop({
      ...options,
      autoExecute: this.globalAutonomyEnabled ? options?.autoExecute : false,
    });
    this.lastRunAt = new Date().toISOString();
    this.lastDetections = result.detections;
    this.lastPlan = { tasks: result.planned, createdAt: this.lastRunAt, fromIssues: result.detections };

    const plannedById = new Map(result.planned.map((t) => [t.taskId, t]));

    result.pendingApproval.forEach((task) => {
      this.pending.set(task.taskId, { ...task, status: "PENDING" as AutonomyTaskStatus });
    });

    result.blocked.forEach((task) => {
      this.blocked.set(task.taskId, { ...task, status: "BLOCKED" as AutonomyTaskStatus });
    });

    result.queued.forEach((task) => {
      this.running.set(task.taskId, { ...task, status: "QUEUED" as AutonomyTaskStatus });
    });

    result.executed.forEach((execution) => {
      const task = plannedById.get(execution.taskId);
      if (task) {
        const completedTask: AutonomyTask = {
          ...task,
          status: "COMPLETED" as AutonomyTaskStatus,
          updatedAt: new Date().toISOString(),
          result: execution,
        };
        this.completed.set(task.taskId, completedTask);
      }
    });

    this.lastExecuted = result.executed;

    return result;
  }

  async approveTask(taskId: string, actor?: PipelineActor) {
    // Find the pending suggestion
    const [row] = await findAISuggestions({ where: { id: taskId, status: "pending" }, take: 1 });
    if (!row) throw notFound("Task not found or already processed");
    // Mark as approved
    await updateAISuggestion(taskId, {
      status: "approved",
      approvedByUserId: actor?.userId ?? null,
      approvedAt: new Date(),
    });
    // Optionally, execute the task after approval
    // (You may want to trigger execution logic here, or in a queue)
    return { ...row, status: "approved" };
  }

  async rejectTask(taskId: string, reason?: string) {
    const [row] = await findAISuggestions({ where: { id: taskId, status: "pending" }, take: 1 });
    if (!row) throw notFound("Task not found in pending queue");
    await updateAISuggestion(taskId, {
      status: "rejected",
      failureReason: reason ?? "Rejected by reviewer",
    });
    return { ...row, status: "rejected", failureReason: reason };
  }

  async enqueue(task: AutonomyTask) {
    if (!task.taskId) throw badRequest("taskId required");
    const tenantId = typeof task.inputs?.tenantId === "string" ? task.inputs.tenantId : "unknown";
    const brandId = typeof task.inputs?.brandId === "string" ? task.inputs.brandId : "unknown";
    await createAISuggestion({
      id: task.taskId,
      tenantId,
      brandId,
      agent: task.agentId,
      domain: task.goal,
      suggestionType: task.engine,
      riskLevel: task.risk,
      status: "pending",
      requiredApprovalRole: "REVIEWER",
      inputSnapshotJson: JSON.stringify(task.inputs ?? {}),
      proposedOutputJson: "{}",
      correlationId: task.taskId,
    });
  }
}

export const autonomyService = new AutonomyService();
