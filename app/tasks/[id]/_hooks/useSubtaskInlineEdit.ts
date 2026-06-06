"use client";

import { useState } from "react";
import type { Task } from "@/lib/types";

export function useSubtaskInlineEdit(saveTitle: (id: number, title: string) => Promise<void>) {
  const [editingSubtaskId, setEditingSubtaskId] = useState<number | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState("");

  function startEditing(sub: Task) {
    setEditingSubtaskId(sub.id);
    setEditingSubtaskTitle(sub.title);
  }

  function cancelEditing() {
    setEditingSubtaskId(null);
  }

  async function saveSubtaskTitle(sub: Task) {
    const trimmed = editingSubtaskTitle.trim();
    setEditingSubtaskId(null);
    if (!trimmed || trimmed === sub.title) return;
    await saveTitle(sub.id, trimmed);
  }

  return {
    editingSubtaskId,
    editingSubtaskTitle,
    setEditingSubtaskTitle,
    startEditing,
    cancelEditing,
    saveSubtaskTitle,
  };
}
