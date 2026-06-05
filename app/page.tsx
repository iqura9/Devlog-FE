import { HomeView } from "@/components/HomeView";
import { getTasksServer } from "@/lib/api.server";
import type { Task } from "@/lib/types";

export default async function Home() {
  let initialTasks: Task[] = [];
  let initialError: string | null = null;
  try {
    initialTasks = await getTasksServer("priority");
  } catch (e) {
    initialError = (e as Error).message;
  }
  return <HomeView initialTasks={initialTasks} initialError={initialError} />;
}
