"use client";

import { Maximize2, Trash2 } from "lucide-react";
import { ControlledSelect } from "@/components/ui/ControlledSelect";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { cn } from "@/lib/utils";
import { STATUS_OPTIONS } from "@/lib/format";
import type { Status, Task } from "@/lib/types";
import type { useSubtaskInlineEdit } from "../_hooks/useSubtaskInlineEdit";

interface SubtaskItemProps {
  sub: Task;
  itemRef?: React.RefObject<HTMLLIElement | null>;
  isHighlighted: boolean;
  inlineEdit: ReturnType<typeof useSubtaskInlineEdit>;
  onChangeEstimation: (id: number, value: string) => void;
  onChangeStatus: (id: number, status: Status) => void;
  onDeleteSubtask: (id: number) => Promise<void>;
  onViewSubtask: (sub: Task) => void;
}

export function SubtaskItem({
  sub,
  itemRef,
  isHighlighted,
  inlineEdit,
  onChangeEstimation,
  onChangeStatus,
  onDeleteSubtask,
  onViewSubtask,
}: SubtaskItemProps) {
  const isEditingTitle = inlineEdit.editingSubtaskId === sub.id;

  return (
    <li
      ref={itemRef}
      className={cn(
        "group flex items-center gap-2.5 rounded-lg border bg-background py-2 pl-3 pr-2.5 transition-colors",
        isHighlighted
          ? "border-primary/50 bg-primary/5 ring-2 ring-primary/20"
          : "border-border",
      )}
    >
      {isEditingTitle ? (
        <input
          autoFocus
          className="flex-1 rounded border border-primary/40 bg-primary/5 px-1.5 py-0.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
          value={inlineEdit.editingSubtaskTitle}
          onChange={(e) => inlineEdit.setEditingSubtaskTitle(e.target.value)}
          onBlur={() => inlineEdit.saveSubtaskTitle(sub)}
          onKeyDown={(e) => {
            if (e.key === "Enter") inlineEdit.saveSubtaskTitle(sub);
            if (e.key === "Escape") inlineEdit.cancelEditing();
          }}
        />
      ) : (
        <span
          className="flex-1 cursor-default select-none text-[13px]"
          onDoubleClick={() => inlineEdit.startEditing(sub)}
          title="Double-click to edit"
        >
          {sub.title}
        </span>
      )}

      <div className="flex items-center gap-1">
        <input
          type="number"
          min="0.5"
          step="0.5"
          className="w-14 rounded border border-border/60 bg-transparent px-1.5 py-0.5 text-center font-mono text-[11px] text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20"
          value={sub.estimation ?? ""}
          placeholder="—"
          onChange={(e) => onChangeEstimation(sub.id, e.target.value)}
          title="Estimated hours"
        />
        <span className="text-[10px] text-muted-foreground/50">h</span>
      </div>

      <ControlledSelect
        value={sub.status}
        onChange={(v) => onChangeStatus(sub.id, v as Status)}
        options={STATUS_OPTIONS}
        variant="pill"
      />

      <button
        onClick={() => onViewSubtask(sub)}
        className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted-foreground/40 opacity-0 transition-all group-hover:opacity-100 hover:bg-primary/10 hover:text-primary"
        aria-label="View subtask description"
        title="View description"
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </button>

      <ConfirmDialog
        onConfirm={() => onDeleteSubtask(sub.id)}
        title="Delete subtask?"
        description={`"${sub.title}" will be permanently deleted.`}
        confirmLabel="Delete"
      >
        <button
          className="ml-1 grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted-foreground/40 opacity-0 transition-all group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
          aria-label="Delete subtask"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </ConfirmDialog>
    </li>
  );
}
