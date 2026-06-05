"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Status, Task } from "@/lib/types";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";

/**
 * Owns the subtask list and its CRUD. Estimation edits update locally first (responsive input)
 * and PATCH on a debounce instead of once per keystroke.
 */
export function useSubtasks(parentId: number, initial: Task[]) {
  const [subtasks, setSubtasks] = useState<Task[]>(initial);

  const replace = (updated: Task) =>
    setSubtasks((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));

  /** Append agent-created subtasks (used by the decompose flow). */
  function appendMany(created: Task[]) {
    setSubtasks((prev) => [...prev, ...created]);
  }

  /** Returns true when the subtask was created so the caller can reset its input. */
  async function addSubtask(title: string): Promise<boolean> {
    try {
      const sub = await api.createSubtask(parentId, { title });
      setSubtasks((prev) => [...prev, sub]);
      return true;
    } catch (e) {
      toast.error((e as Error).message);
      return false;
    }
  }

  async function deleteSubtask(id: number) {
    try {
      await api.deleteTask(id);
      setSubtasks((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function changeStatus(id: number, status: Status) {
    try {
      replace(await api.updateTask(id, { status }));
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function saveTitle(id: number, title: string) {
    try {
      replace(await api.updateTask(id, { title }));
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const commitEstimation = useDebouncedCallback(async (id: number, hours: number | null) => {
    try {
      replace(await api.updateTask(id, { estimation: hours }));
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, 600);

  function changeEstimation(id: number, value: string) {
    const hours = value === "" ? null : parseFloat(value);
    if (hours !== null && (Number.isNaN(hours) || hours <= 0)) return;
    // Optimistic local update keeps the controlled input responsive…
    setSubtasks((prev) => prev.map((s) => (s.id === id ? { ...s, estimation: hours } : s)));
    // …while the actual PATCH is debounced.
    commitEstimation.call(id, hours);
  }

  return {
    subtasks,
    appendMany,
    addSubtask,
    deleteSubtask,
    changeStatus,
    saveTitle,
    changeEstimation,
  };
}
