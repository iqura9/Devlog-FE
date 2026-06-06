"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { PriorityBadge, StatusBadge } from "@/components/badges";
import { SubtaskDialog } from "@/components/SubtaskDialog";
import { ageLabel, ageInDays, formatHours, taskLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Priority, Task, TaskWithSubtasks } from "@/lib/types";
import { Links, resolvePath } from "@/routes/paths";

const ACCENT_BAR: Record<Priority, string> = {
  high: "before:bg-priority-high",
  medium: "before:bg-priority-medium",
  low: "before:bg-priority-low",
};

interface TaskCardProps {
  task: TaskWithSubtasks;
  staleThreshold: number;
}

export function TaskCard({ task, staleThreshold }: TaskCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [viewingSubtask, setViewingSubtask] = useState<Task | null>(null);

  const doneCount = task.subtasks.filter((s) => s.status === "done").length;
  const isStale =
    task.status !== "done" && ageInDays(task.updatedAt) >= staleThreshold;

  // A task's estimation is its own value, unless it opts into summing from subtasks.
  const estimationHours = task.estimationFromSubtasks
    ? task.subtasks.reduce((sum, s) => sum + (s.estimation ?? 0), 0)
    : task.estimation ?? 0;
  const hasEstimation = estimationHours > 0;

  function handleCardClick(e: React.MouseEvent) {
    if (
      (e.target as HTMLElement).closest(
        "button, a, input, select, [role='button']",
      )
    )
      return;
    router.push(resolvePath(Links.tasks.view, { id: task.id }));
  }

  return (
    <article
      onClick={handleCardClick}
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-soft",
        "cursor-pointer transition-all hover:-translate-y-px hover:shadow-card",
        "before:absolute before:inset-y-0 before:left-0 before:w-0.75",
        ACCENT_BAR[task.priority],
      )}
    >
      <h3 className="text-[15.5px] font-bold leading-snug tracking-tight">
        {taskLabel(task.id, task.title)}
      </h3>

      {task.description ? (
        <p className="mt-1 line-clamp-2 text-[13.5px] leading-relaxed text-muted-foreground">
          {task.description}
        </p>
      ) : null}

      <div className="flex justify-between">
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />

          {task.subtasks.length > 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((v) => !v);
              }}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5",
                "font-mono text-[11px] transition-colors",
                expanded
                  ? "border-primary/40 bg-primary/5 text-primary"
                  : "border-border bg-muted/50 text-muted-foreground hover:border-primary/30 hover:text-foreground",
              )}
            >
              {expanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              {expanded ? "Hide" : "Show"} {task.subtasks.length} subtask
              {task.subtasks.length !== 1 ? "s" : ""}
              {doneCount > 0 ? (
                <span className="text-status-done">
                  &nbsp;· {doneCount} done
                </span>
              ) : null}
            </button>
          ) : null}

          {isStale ? (
            <span className="font-mono text-xs font-semibold text-priority-high">
              · stale
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {hasEstimation ? (
            <span className="inline-flex items-center gap-0.5 rounded-full border border-border bg-muted/50 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
              <svg
                className="h-3 w-3 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {formatHours(estimationHours)}h
            </span>
          ) : null}
          <span className="font-mono text-xs text-muted-foreground">
            {ageLabel(task.createdAt)}
          </span>
        </div>
      </div>

      {expanded && task.subtasks.length > 0 ? (
        <div className="mt-3.5 border-t border-dashed border-border pt-3.5">
          <div className="mb-2.5 flex items-center gap-2.5">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Subtasks {doneCount}/{task.subtasks.length}
            </span>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-status-done transition-all duration-300"
                style={{
                  width: `${Math.round(
                    (doneCount / task.subtasks.length) * 100,
                  )}%`,
                }}
              />
            </div>
          </div>

          <ul className="flex flex-col gap-1.5">
            {task.subtasks.map((sub) => {
              return (
                <li
                  key={sub.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewingSubtask(sub);
                  }}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-background py-2 pl-3 pr-3 transition-colors hover:border-primary/40"
                  title="View description"
                >
                  <span className={"flex-1 text-[13px]"}>{sub.title}</span>

                  {sub.estimation != null ? (
                    <span className="font-mono text-[11px] text-muted-foreground/60 rounded-md px-3 py-0.5 bg-muted border border-border">
                      {formatHours(sub.estimation)}h
                    </span>
                  ) : null}

                  <StatusBadge status={sub.status} />
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <SubtaskDialog
        subtask={viewingSubtask}
        onClose={() => setViewingSubtask(null)}
      />
    </article>
  );
}
