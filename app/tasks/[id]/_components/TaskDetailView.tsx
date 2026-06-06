"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import type { Task } from "@/lib/types";
import { taskLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Links } from "@/routes/paths";
import { useTaskEditor } from "@/hooks/useTaskEditor";
import { useSubtasks } from "@/hooks/useSubtasks";
import { useDecompose } from "@/hooks/useDecompose";
import { SubtaskDialog } from "@/components/SubtaskDialog";
import { Header } from "@/components/Header";
import { TaskEditPanel } from "./TaskEditPanel";
import { SubtaskSection } from "./SubtaskSection";
import { TaskDetailsSidebar } from "./TaskDetailsSidebar";
import type { Priority } from "@/lib/types";

const PRIORITY_BORDER: Record<Priority, string> = {
  high: "border-l-priority-high",
  medium: "border-l-priority-medium",
  low: "border-l-priority-low",
};

interface TaskDetailViewProps {
  initialTask: Task;
  initialSubtasks: Task[];
  highlightedSubtaskId?: number;
}

export function TaskDetailView({
  initialTask,
  initialSubtasks,
  highlightedSubtaskId,
}: TaskDetailViewProps) {
  const router = useRouter();
  const editor = useTaskEditor(initialTask);
  const { task } = editor;
  const subs = useSubtasks(initialTask.id, initialSubtasks);
  const decompose = useDecompose(task, subs.appendMany);

  const [viewingSubtask, setViewingSubtask] = useState<Task | null>(null);

  const isRoot = task.parentId === null;
  const subtaskEstimationTotal = subs.subtasks.reduce(
    (sum, s) => sum + (s.estimation ?? 0),
    0,
  );

  async function deleteTask() {
    await api.deleteTask(task.id);
    toast.success("Task deleted");
    router.push(Links.tasks.index);
  }

  return (
    <div className="w-full">
      <Header />

      <Link
        href={Links.tasks.index}
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All tasks
      </Link>

      {highlightedSubtaskId ? (
        <p className="mb-4 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 font-mono text-[11.5px] text-primary/70">
          Viewing parent task — subtask{" "}
          <span className="font-semibold">
            {taskLabel(highlightedSubtaskId, "", true)}
          </span>{" "}
          is highlighted below
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_260px]">
        <div
          className={cn(
            "overflow-hidden rounded-xl border border-border bg-card shadow-card",
            "border-l-4",
            PRIORITY_BORDER[task.priority],
          )}
        >
          <TaskEditPanel taskId={task.id} editor={editor} />
          {isRoot ? (
            <SubtaskSection
              subs={subs}
              decompose={decompose}
              highlightedSubtaskId={highlightedSubtaskId}
              onViewSubtask={setViewingSubtask}
            />
          ) : null}
        </div>

        <TaskDetailsSidebar
          editor={editor}
          subtaskEstimationTotal={subtaskEstimationTotal}
          isRoot={isRoot}
          onDeleteTask={deleteTask}
        />
      </div>

      <SubtaskDialog
        subtask={viewingSubtask}
        onClose={() => setViewingSubtask(null)}
      />
    </div>
  );
}
