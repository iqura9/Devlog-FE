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
  estimationFromSubtasks: boolean; // when true, effective estimation = sum of subtasks
  createdAt: string; // ISO-8601
  updatedAt: string; // ISO-8601
}

export interface TasksResult {
  tasks: Task[];
  error: string | null;
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
  output: string; // JSON string (prioritize / decompose / status-update) or markdown (sweep-stale)
  model: string; // e.g. "gemini-2.5-flash"
  steps: AgentStep[];
}

// ── Day plan output (parsed from the prioritize agent's AgentRun.output) ────
export interface DayPlanItem {
  id: number;
  title: string;
  hours: number;
  assumed: boolean; // true when the agent estimated the hours itself
}

export interface DayPlan {
  items: DayPlanItem[];
  focus: string;
  totalHours: number;
  note?: string;
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
  estimation?: number; // hours
}

export interface DecomposeDecomposed {
  status: "decomposed";
  subtasks: DecomposeSubtask[];
}

export type DecomposeOutput = DecomposeNeedsClarification | DecomposeDecomposed;

// ── Standup output (parsed from the status-update agent's AgentRun.output JSON string) ──

export interface StandupItem {
  id: number;
  title: string;
  status: Status;
}

export interface StandupPlanComparison {
  planned: number;
  completed: number;
  slipped: StandupItem[];
}

export interface StandupReport {
  date: string;                         // ISO date the report covers (YYYY-MM-DD)
  summary: string;                      // one-line headline
  doneToday: StandupItem[];
  inProgress: StandupItem[];
  nextUp: StandupItem[];                // top carry-over tasks
  blockers: string[];
  planComparison?: StandupPlanComparison; // present only when a plan was passed
}

// ── Triage output (parsed from the stale-sweeper agent's AgentRun.output JSON string) ──

export type TriageAction = "raise_priority" | "split" | "close" | "escalate" | "monitor";

export interface TriageItem {
  id: number;
  title: string;
  status: Status;
  priority: Priority;
  daysSinceUpdate: number;
  diagnosis: string;
  action: TriageAction;
  applied: boolean;
  changes?: string;
}

export interface TriageReport {
  date: string;
  thresholdDays: number;
  summary: string;
  stale: TriageItem[];
  healthy: number;
  applied: boolean;
}

// ── Status-update tones ────────────────────────────────────────────────────
export type Tone = "technical" | "casual" | "formal";
