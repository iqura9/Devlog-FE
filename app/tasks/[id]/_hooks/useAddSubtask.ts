"use client";

import { useEffect, useRef, useState } from "react";

export function useAddSubtask(addSubtask: (title: string) => Promise<boolean>) {
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const subtaskInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (addingSubtask) subtaskInputRef.current?.focus();
  }, [addingSubtask]);

  async function handleAddSubtask() {
    const trimmed = newSubtaskTitle.trim();
    if (!trimmed) return;
    if (await addSubtask(trimmed)) {
      setNewSubtaskTitle("");
      setAddingSubtask(false);
    }
  }

  function cancel() {
    setAddingSubtask(false);
    setNewSubtaskTitle("");
  }

  return {
    addingSubtask,
    setAddingSubtask,
    newSubtaskTitle,
    setNewSubtaskTitle,
    handleAddSubtask,
    cancel,
    subtaskInputRef,
  };
}
