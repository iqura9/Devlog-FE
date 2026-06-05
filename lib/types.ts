// Domain types matching the DevLog Express Backend at /Users/iqura/projects/devlog/Backend

export type Status = "todo" | "in-progress" | "done";
export type Priority = "low" | "medium" | "high";

export const STATUSES: Status[] = ["todo", "in-progress", "done"];
export const PRIORITIES: Priority[] = ["low", "medium", "high"];

/** A task as returned by the Backend API (IDs are numbers; subtasks share the same type with parentId set). */
export interface Task {
  id: number;
  parentId: number | null;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  estimation: number | null; // hours
  createdAt: string; // ISO-8601
  updatedAt: string; // ISO-8601
}

/** Task enriched on the client with its direct children grouped in. */
export type TaskWithSubtasks = Task & { subtasks: Task[] };

// ── Agent types ────────────────────────────────────────────────────────────

/** One tool-call step in an agent run (for the AgentTrace visualiser). */
export interface AgentStep {
  tool: string;
  args: Record<string, unknown>;
  result: unknown;
}

/** The envelope every agent endpoint wraps its output in. */
export interface AgentRun {
  output: string;   // markdown (prioritize / status-update / sweep-stale) or JSON string (decompose)
  model: string;    // e.g. "gemini-2.5-flash"
  steps: AgentStep[];
}

// ── Decompose output (parsed from AgentRun.output JSON string) ─────────────
export interface DecomposeNeedsClarification {
  status: "needs_clarification";
  question: string;
}

export interface DecomposeSubtask {
  title: string;
  description?: string;
  priority?: Priority;
}

export interface DecomposeDecomposed {
  status: "decomposed";
  subtasks: DecomposeSubtask[];
}

export type DecomposeOutput = DecomposeNeedsClarification | DecomposeDecomposed;

// ── Status-update tones ────────────────────────────────────────────────────
export type Tone = "technical" | "casual" | "formal";
