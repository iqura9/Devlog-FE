import { notFound } from "next/navigation";
import { getTaskServer, getSubtasksServer } from "@/lib/api.server";
import { TaskDetailView } from "@/components/TaskDetailView";
import type { Task } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const taskId = Number(id);
  if (isNaN(taskId)) notFound();

  let task: Task | undefined;
  let subtasks: Task[] = [];
  try {
    [task, subtasks] = await Promise.all([
      getTaskServer(taskId),
      getSubtasksServer(taskId),
    ]);
  } catch {
    notFound();
  }

  if (!task) notFound();

  return <TaskDetailView initialTask={task} initialSubtasks={subtasks} />;
}
