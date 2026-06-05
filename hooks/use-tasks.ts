"use client";

import { useMemo, useState } from "react";
import type { Status, Task, TaskWithSubtasks } from "@/lib/types";

export type StatusFilter = Status | "all";
export type SortKey = "priority" | "createdAt" | "updatedAt";

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

export function useTaskBoard(allTasks: Task[]) {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("priority");

  const grouped = useMemo((): TaskWithSubtasks[] => {
    const children = new Map<number, Task[]>();
    for (const t of allTasks) {
      if (t.parentId !== null) {
        const arr = children.get(t.parentId) ?? [];
        arr.push(t);
        children.set(t.parentId, arr);
      }
    }
    const roots = allTasks
      .filter((t) => t.parentId === null)
      .map((t) => ({ ...t, subtasks: children.get(t.id) ?? [] }));
    return sortTasks(roots, sort);
  }, [allTasks, sort]);

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

  return { tasks, counts, filter, setFilter, sort, setSort };
}
