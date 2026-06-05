"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Play, Copy, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ControlledSelect } from "@/components/ui/ControlledSelect";
import { AgentTrace } from "@/components/agents/AgentTrace";
import { AgentUnavailable } from "@/components/agents/AgentUnavailable";
import { SlackMessageCard } from "@/components/agents/SlackMessageCard";
import { ModelBadge } from "@/components/badges";
import { api } from "@/lib/api";
import { useAgentRun } from "@/hooks/useAgentRun";
import type { Task } from "@/lib/types";

export function StandupPanel() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const { run, loading, result, unavailable } = useAgentRun((taskId: number) =>
    api.statusUpdate({ taskId }),
  );

  useEffect(() => {
    api
      .listTasks()
      .then((all) => {
        const active = all.filter(
          (t) => t.parentId === null && t.status !== "done",
        );
        setTasks(active);
        if (active.length > 0) {
          const inProgress = active.find((t) => t.status === "in-progress");
          setSelectedId(String((inProgress ?? active[0]).id));
        }
      })
      .catch(() => {});
  }, []);

  function generate() {
    if (!selectedId) return;
    run(Number(selectedId));
  }

  function copy() {
    if (!result) return;
    navigator.clipboard
      .writeText(result.output)
      .then(() => toast.success("Copied to clipboard"));
  }

  if (unavailable) {
    return <AgentUnavailable />;
  }

  return (
    <div>
      <div className="mb-3.5 flex flex-col gap-2.5 rounded-lg border border-border bg-card p-3">
        <div>
          <p className="text-[13px] font-bold">Draft standup</p>
          <p className="text-[11px] text-muted-foreground">
            Slack-style async update for a task
          </p>
        </div>

        {tasks.length === 0 ? (
          <p className="text-[12px] text-muted-foreground">
            No open tasks to report on.
          </p>
        ) : (
          <ControlledSelect
            value={selectedId}
            onChange={setSelectedId}
            options={tasks.map((t) => ({
              value: String(t.id),
              label: t.title.length > 42 ? t.title.slice(0, 42) + "…" : t.title,
            }))}
            className="text-[12px]"
          />
        )}

        <Button size="sm" onClick={generate} disabled={loading || !selectedId}>
          <Play className="h-3.5 w-3.5" />
          {loading ? "Generating…" : "Generate"}
        </Button>
      </div>

      <AgentTrace
        steps={["Gather tasks", "Group + assess", "Compose"]}
        state={loading ? "running" : result ? "done" : "idle"}
      />

      {result ? (
        <>
          <SlackMessageCard output={result.output} />

          <div className="mt-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-mono text-[10.5px] text-muted-foreground/70">
              <span>
                {result.steps.length} step{result.steps.length !== 1 ? "s" : ""}
              </span>
              <ModelBadge model={result.model} />
            </div>
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1 px-2 text-[11.5px]"
                onClick={generate}
                disabled={loading}
              >
                <RotateCcw className="h-3 w-3" />
                Redo
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 px-2.5 text-[11.5px]"
                onClick={copy}
              >
                <Copy className="h-3 w-3" />
                Copy
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
