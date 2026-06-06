import { notFound } from "next/navigation";
import { getTaskServer, getSubtasksServer } from "@/lib/api.server";
import { TaskDetailView } from "@/app/tasks/[id]/_components/TaskDetailView";
import type { Task } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const taskId = Number(id);
  if (Number.isNaN(taskId)) notFound();

  let task: Task | undefined;
  let subtasks: Task[] = [];
  let highlightedSubtaskId: number | undefined;

  try {
    const fetched = await getTaskServer(taskId);

    if (fetched.parentId !== null) {
      highlightedSubtaskId = taskId;
      [task, subtasks] = await Promise.all([
        getTaskServer(fetched.parentId),
        getSubtasksServer(fetched.parentId),
      ]);
    } else {
      task = fetched;
      subtasks = await getSubtasksServer(taskId);
    }
  } catch {
    notFound();
  }

  if (!task) notFound();

  return (
    <TaskDetailView
      initialTask={task}
      initialSubtasks={subtasks}
      highlightedSubtaskId={highlightedSubtaskId}
    />
  );
}
