"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Priority, Status, Task } from "@/lib/types";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";

type Field = "title" | "desc";

/**
 * Owns the editable task header: debounced title/description autosave plus status/priority
 * mutations. Blur flushes immediately and cancels the pending debounce so a field never PATCHes
 * twice.
 */
export function useTaskEditor(initialTask: Task) {
  const [task, setTask] = useState<Task>(initialTask);
  const [title, setTitle] = useState(initialTask.title);
  const [description, setDescription] = useState(initialTask.description);
  const [editingField, setEditingField] = useState<Field | null>(null);

  async function saveField(field: "title" | "description", value: string) {
    const trimmed = field === "title" ? value.trim() : value;
    if (field === "title" && !trimmed) return;
    if (field === "title" && trimmed === task.title) return;
    if (field === "description" && value === task.description) return;
    try {
      setTask(await api.updateTask(task.id, { [field]: trimmed }));
    } catch (e) {
      toast.error((e as Error).message);
      if (field === "title") setTitle(task.title);
    }
  }

  const titleDebounce = useDebouncedCallback((v: string) => saveField("title", v), 500);
  const descDebounce = useDebouncedCallback((v: string) => saveField("description", v), 800);

  function handleTitleChange(v: string) {
    setTitle(v);
    titleDebounce.call(v);
  }

  function handleDescChange(v: string) {
    setDescription(v);
    descDebounce.call(v);
  }

  function handleTitleBlur() {
    setEditingField(null);
    titleDebounce.cancel();
    saveField("title", title);
  }

  function handleDescBlur() {
    setEditingField(null);
    descDebounce.cancel();
    saveField("description", description);
  }

  async function changeStatus(status: Status) {
    try {
      setTask(await api.updateTask(task.id, { status }));
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function changePriority(priority: Priority) {
    try {
      setTask(await api.updateTask(task.id, { priority }));
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return {
    task,
    title,
    description,
    editingField,
    setEditingField,
    handleTitleChange,
    handleDescChange,
    handleTitleBlur,
    handleDescBlur,
    changeStatus,
    changePriority,
  };
}
