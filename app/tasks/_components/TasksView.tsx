"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { TaskBoard } from "@/components/TaskBoard";
import { TaskBoardSkeleton } from "@/components/TaskBoardSkeleton";
import { TaskDialog } from "@/app/tasks/_components/TaskDialog";
import { AgentPanel } from "@/components/agents/AgentPanel";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDialogState } from "@/hooks/useDialogState";
import { TasksResult } from "@/lib/types";

interface HomeViewProps {
  tasksPromise: Promise<TasksResult>;
}

export function TasksView({ tasksPromise }: HomeViewProps) {
  const router = useRouter();
  const {
    isOpen: isCreateDialogOpen,
    close: createDialogClose,
    open: createDialogOpen,
  } = useDialogState(false);

  function refresh() {
    router.refresh();
  }

  return (
    <div className="w-full">
      <Header
        action={
          <Button onClick={createDialogOpen}>
            <Plus className="h-4 w-4" strokeWidth={2.4} />
            New task
          </Button>
        }
      />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_384px]">
        <main>
          <Suspense fallback={<TaskBoardSkeleton />}>
            <TaskBoard tasksPromise={tasksPromise} />
          </Suspense>
        </main>

        <AgentPanel onChanged={refresh} />
      </div>

      <TaskDialog
        open={isCreateDialogOpen}
        onClose={createDialogClose}
        onSaved={refresh}
      />
    </div>
  );
}
