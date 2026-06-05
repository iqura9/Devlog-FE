"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { Toolbar } from "@/components/Toolbar";
import { TaskList } from "@/components/TaskList";
import { TaskDialog } from "@/components/TaskDialog";
import { AgentPanel } from "@/components/agents/AgentPanel";
import { useTasks } from "@/hooks/use-tasks";

const STALE_THRESHOLD_DAYS = 7;

export default function Home() {
  const { tasks, counts, filter, setFilter, sort, setSort, loading, error, refresh } = useTasks();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="mx-auto max-w-[1320px] px-5 pb-20 sm:px-7">
      <Header onNewTask={() => setCreateOpen(true)} />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_384px]">
        <main>
          <Toolbar
            filter={filter}
            setFilter={setFilter}
            counts={counts}
            sort={sort}
            setSort={setSort}
          />

          {error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
              Couldn&apos;t reach the backend: {error}
              <br />
              <span className="text-muted-foreground">
                Make sure the Express backend is running on port 3001 (
                <code>cd Backend && npm run dev</code>).
              </span>
            </div>
          ) : (
            <TaskList
              tasks={tasks}
              loading={loading}
              staleThreshold={STALE_THRESHOLD_DAYS}
            />
          )}
        </main>

        <AgentPanel onChanged={refresh} />
      </div>

      {/* Create new task */}
      <TaskDialog
        open={createOpen}
        task={null}
        onClose={() => setCreateOpen(false)}
        onSaved={refresh}
      />
    </div>
  );
}
