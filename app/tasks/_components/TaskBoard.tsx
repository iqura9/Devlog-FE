"use client";

import { use } from "react";
import { Toolbar } from "@/components/Toolbar";
import { TaskList } from "@/app/tasks/_components/TaskList";
import { useTaskBoard } from "@/hooks/useTasks";
import { TasksResult } from "@/lib/types";

const STALE_THRESHOLD_DAYS = 7;

interface TaskBoardProps {
  tasksPromise: Promise<TasksResult>;
}

export function TaskBoard({ tasksPromise }: TaskBoardProps) {
  const { tasks: allTasks, error } = use(tasksPromise);
  const { tasks, counts, filter, setFilter, sort, setSort } =
    useTaskBoard(allTasks);

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
        Couldn&apos;t reach the backend: {error}
        <br />
        <span className="text-muted-foreground">
          Make sure the Express backend is running on port 3001 (
          <code>cd Backend && npm run dev</code>).
        </span>
      </div>
    );
  }

  return (
    <>
      <Toolbar
        filter={filter}
        setFilter={setFilter}
        counts={counts}
        sort={sort}
        setSort={setSort}
      />
      <TaskList tasks={tasks} staleThreshold={STALE_THRESHOLD_DAYS} />
    </>
  );
}
