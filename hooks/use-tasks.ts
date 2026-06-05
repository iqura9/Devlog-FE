"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Status, Task, TaskWithSubtasks } from "@/lib/types";

export type StatusFilter = Status | "all";
export type SortKey = "priority" | "createdAt" | "updatedAt";

interface UseTasksInit {
  initialTasks?: Task[];
  initialError?: string | null;
}

const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

function sortTasks(tasks: TaskWithSubtasks[], sort: SortKey): TaskWithSubtasks[] {
  return [...tasks].sort((a, b) => {
    if (sort === "priority") {
      const diff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (diff !== 0) return diff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sort === "createdAt") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export function useTasks({ initialTasks, initialError }: UseTasksInit = {}) {
  const [flat, setFlat] = useState<Task[]>(initialTasks ?? []);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("priority");
  const [loading, setLoading] = useState(!initialTasks);
  const [error, setError] = useState<string | null>(initialError ?? null);

  const refresh = useCallback(async () => {
    try {
      const apiSort = sort === "updatedAt" ? "priority" : sort;
      const data = await api.listTasks({ sortBy: apiSort });
      setFlat(data);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [sort]);

  useEffect(() => {
    if (!initialTasks) refresh();
  }, [refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  const grouped = useMemo((): TaskWithSubtasks[] => {
    const children = new Map<number, Task[]>();
    for (const t of flat) {
      if (t.parentId !== null) {
        const arr = children.get(t.parentId) ?? [];
        arr.push(t);
        children.set(t.parentId, arr);
      }
    }
    const roots = flat
      .filter((t) => t.parentId === null)
      .map((t) => ({ ...t, subtasks: children.get(t.id) ?? [] }));
    return sortTasks(roots, sort);
  }, [flat, sort]);

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { all: 0, todo: 0, "in-progress": 0, done: 0 };
    for (const t of grouped) {
      c.all++;
      c[t.status]++;
    }
    return c;
  }, [grouped]);

  const tasks = useMemo(
    () => (filter === "all" ? grouped : grouped.filter((t) => t.status === filter)),
    [grouped, filter]
  );

  return { tasks, counts, filter, setFilter, sort, setSort, loading, error, refresh };
}
