"use client";

import { Trash2 } from "lucide-react";
import { ControlledSelect } from "@/components/ui/ControlledSelect";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ageLabel, STATUS_OPTIONS, PRIORITY_OPTIONS } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Priority, Status } from "@/lib/types";
import type { useTaskEditor } from "@/hooks/useTaskEditor";

interface TaskDetailsSidebarProps {
  editor: ReturnType<typeof useTaskEditor>;
  subtaskEstimationTotal: number;
  isRoot: boolean;
  onDeleteTask: () => Promise<void>;
}

export function TaskDetailsSidebar({
  editor,
  subtaskEstimationTotal,
  isRoot,
  onDeleteTask,
}: TaskDetailsSidebarProps) {
  const { task } = editor;

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
        <p className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
          Details
        </p>
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-muted-foreground">Status</span>
            <ControlledSelect
              value={task.status}
              onChange={(v) => editor.changeStatus(v as Status)}
              options={STATUS_OPTIONS}
              variant="pill"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[13px] text-muted-foreground">Priority</span>
            <ControlledSelect
              value={task.priority}
              onChange={(v) => editor.changePriority(v as Priority)}
              options={PRIORITY_OPTIONS}
              variant="pill"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[13px] text-muted-foreground">Estimation</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0.5"
                step="0.5"
                disabled={task.estimationFromSubtasks}
                className={cn(
                  "w-16 rounded border border-border/60 bg-transparent px-1.5 py-0.5 text-center font-mono text-[12px] text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20",
                  task.estimationFromSubtasks && "cursor-not-allowed opacity-60",
                )}
                value={
                  task.estimationFromSubtasks
                    ? subtaskEstimationTotal
                    : (task.estimation ?? "")
                }
                placeholder="—"
                onChange={(e) => editor.changeEstimation(e.target.value)}
                title={
                  task.estimationFromSubtasks
                    ? "Summed from subtasks"
                    : "Estimated hours"
                }
              />
              <span className="text-[10px] text-muted-foreground/50">h</span>
            </div>
          </div>

          {isRoot ? (
            <label className="flex cursor-pointer items-center justify-between">
              <span className="text-[13px] text-muted-foreground">
                Sum from subtasks
              </span>
              <input
                type="checkbox"
                className="h-3.5 w-3.5 cursor-pointer accent-primary"
                checked={task.estimationFromSubtasks}
                onChange={(e) =>
                  editor.toggleEstimationFromSubtasks(e.target.checked)
                }
                title="Take estimation from the sum of subtasks"
              />
            </label>
          ) : null}

          <div className="flex items-center justify-between">
            <span className="text-[13px] text-muted-foreground">Created</span>
            <span className="font-mono text-[12px] text-muted-foreground">
              {ageLabel(task.createdAt)}
            </span>
          </div>
        </div>
      </div>

      <ConfirmDialog
        onConfirm={onDeleteTask}
        title="Delete task?"
        description={`"${task.title}" will be permanently deleted. This can't be undone.`}
        confirmLabel="Delete task"
      >
        <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
          Delete task
        </button>
      </ConfirmDialog>
    </div>
  );
}
