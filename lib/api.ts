import type { AgentRun, Priority, Status, Task, Tone } from "./types";

/** Thrown when the backend returns 503 (GEMINI_API_KEY not configured). */
export class AgentUnavailableError extends Error {
  constructor(message?: string) {
    super(message ?? "AI features require a GEMINI_API_KEY in the backend .env");
    this.name = "AgentUnavailableError";
  }
}

/** Low-level fetch wrapper.
 *  - Unwraps the `{data}` envelope for successful responses.
 *  - Returns `undefined` on 204 No Content.
 *  - Throws `AgentUnavailableError` on 503.
 *  - Throws plain `Error` with the backend message for other errors.
 */
async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => ({})) as {
    data?: unknown;
    error?: { code?: string; message?: string };
  };

  if (!res.ok) {
    if (res.status === 503) {
      throw new AgentUnavailableError(body.error?.message);
    }
    throw new Error(body.error?.message ?? `Request failed (${res.status})`);
  }

  // Unwrap the {data} envelope; fall back to the raw body for unexpected shapes.
  return (body.data !== undefined ? body.data : body) as T;
}

export interface TaskFilters {
  status?: Status;
  sortBy?: "priority" | "createdAt";
  order?: "asc" | "desc";
  parentId?: number | "null";
}

export const api = {
  // Returns ALL tasks (root + subtasks) as a flat array for client-side grouping.
  listTasks: (filters: TaskFilters = {}): Promise<Task[]> => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.sortBy) params.set("sortBy", filters.sortBy);
    if (filters.order) params.set("order", filters.order);
    if (filters.parentId !== undefined) params.set("parentId", String(filters.parentId));
    const qs = params.toString();
    return http<Task[]>(`/api/tasks${qs ? `?${qs}` : ""}`);
  },

  getTask: (id: number): Promise<Task> =>
    http<Task>(`/api/tasks/${id}`),

  createTask: (input: {
    title: string;
    description?: string;
    status?: Status;
    priority?: Priority;
    estimation?: number;
  }): Promise<Task> =>
    http<Task>("/api/tasks", { method: "POST", body: JSON.stringify(input) }),

  updateTask: (id: number, patch: {
    title?: string;
    description?: string;
    status?: Status;
    priority?: Priority;
    estimation?: number | null;
    estimationFromSubtasks?: boolean;
  }): Promise<Task> =>
    http<Task>(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),

  deleteTask: (id: number): Promise<void> =>
    http<void>(`/api/tasks/${id}`, { method: "DELETE" }),

  /** Creates a subtask under a parent task. The backend uses parentId for one-level nesting. */
  createSubtask: (parentId: number, input: {
    title: string;
    description?: string;
    priority?: Priority;
    estimation?: number;
  }): Promise<Task> =>
    http<Task>("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ ...input, parentId }),
    }),

  /** Toggles a subtask done/todo by updating its status. */
  setSubtaskStatus: (id: number, done: boolean): Promise<Task> =>
    http<Task>(`/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: done ? "done" : "todo" }),
    }),

  /** Prioritization agent: ranks open tasks with multi-step reasoning. Returns markdown in output. */
  prioritize: (): Promise<AgentRun> =>
    http<AgentRun>("/api/agents/prioritize", { method: "POST" }),

  /** Decomposition agent: breaks a task into subtasks. Returns JSON string in output. */
  decompose: (input: {
    taskId?: number;
    title?: string;
    description?: string;
    persist?: boolean;
    clarification?: string;
  }): Promise<AgentRun> =>
    http<AgentRun>("/api/agents/decompose", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  /** Status-update agent: generates a daily standup report. Returns JSON string in output. */
  statusUpdate: (input: {
    plan?: { items: { id: number; title: string; hours: number }[]; focus?: string; totalHours?: number };
    notes?: string;
    tone?: Tone;
  } = {}): Promise<AgentRun> =>
    http<AgentRun>("/api/agents/status-update", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  /** Stale-sweeper agent: triages neglected tasks. Returns markdown in output. */
  sweepStale: (input: {
    thresholdDays?: number;
    apply?: boolean;
  } = {}): Promise<AgentRun> =>
    http<AgentRun>("/api/agents/sweep-stale", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};
