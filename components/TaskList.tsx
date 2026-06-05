"use client";

import { ClipboardList } from "lucide-react";
import { TaskCard } from "@/components/TaskCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { TaskWithSubtasks } from "@/lib/types";

interface TaskListProps {
  tasks: TaskWithSubtasks[];
  loading: boolean;
  staleThreshold: number;
}

export function TaskList({ tasks, loading, staleThreshold }: TaskListProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2.5">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

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
