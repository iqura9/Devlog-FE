"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddSubtaskInputProps {
  addingSubtask: boolean;
  newSubtaskTitle: string;
  subtaskInputRef: React.RefObject<HTMLInputElement | null>;
  onChangeTitle: (value: string) => void;
  onAdd: () => void;
  onCancel: () => void;
  onStartAdding: () => void;
}

export function AddSubtaskInput({
  addingSubtask,
  newSubtaskTitle,
  subtaskInputRef,
  onChangeTitle,
  onAdd,
  onCancel,
  onStartAdding,
}: AddSubtaskInputProps) {
  if (addingSubtask) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={subtaskInputRef}
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring"
          value={newSubtaskTitle}
          onChange={(e) => onChangeTitle(e.target.value)}
          placeholder="Subtask title…"
          onKeyDown={(e) => {
            if (e.key === "Enter") onAdd();
            if (e.key === "Escape") onCancel();
          }}
        />
        <Button size="sm" onClick={onAdd} disabled={!newSubtaskTitle.trim()}>
          Add
        </Button>
        <button
          onClick={onCancel}
          className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onStartAdding}
      className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-[13px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
    >
      <Plus className="h-3.5 w-3.5" />
      Add subtask
    </button>
  );
}
