import type { Task } from "./types";

const BASE = process.env.BACKEND_URL ?? "http://localhost:3001";

async function httpServer<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Backend returned ${res.status}`);
  const body = (await res.json()) as { data?: unknown };
  return (body.data !== undefined ? body.data : body) as T;
}

export async function getTasksServer(sortBy: "priority" | "createdAt" = "priority"): Promise<Task[]> {
  return httpServer<Task[]>(`/api/tasks?sortBy=${sortBy}`);
}

export async function getTaskServer(id: number): Promise<Task> {
  return httpServer<Task>(`/api/tasks/${id}`);
}

export async function getSubtasksServer(parentId: number): Promise<Task[]> {
  return httpServer<Task[]>(`/api/tasks?parentId=${parentId}`);
}
