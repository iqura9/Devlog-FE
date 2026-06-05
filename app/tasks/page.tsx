import { getTasksServer } from "@/lib/api.server";
import { TasksView } from "./_components/TasksView";
import { TasksResult } from "@/lib/types";

export default function Tasks() {
  const tasksPromise: Promise<TasksResult> = getTasksServer("priority")
    .then((tasks) => ({ tasks, error: null }))
    .catch((e: Error) => ({ tasks: [], error: e.message }));

  return <TasksView tasksPromise={tasksPromise} />;
}
