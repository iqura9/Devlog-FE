"use client";

import { ClipboardList } from "lucide-react";
import { TaskCard } from "@/app/tasks/_components/TaskCard";
import type { TaskWithSubtasks } from "@/lib/types";

interface TaskListProps {
  tasks: TaskWithSubtasks[];
  staleThreshold: number;
}

export function TaskList({ tasks, staleThreshold }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
        <ClipboardList className="h-8 w-8 text-muted-foreground/50" />
        <div>
          <p className="font-semibold">No tasks here</p>
          <p className="text-sm text-muted-foreground">
            Create one with &ldquo;New task&rdquo;, or switch filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} staleThreshold={staleThreshold} />
      ))}
    </div>
  );
}
