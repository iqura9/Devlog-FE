"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Play, Copy, AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AgentTrace } from "@/components/agents/AgentTrace";
import { ModelBadge } from "@/components/badges";
import { api, AgentUnavailableError } from "@/lib/api";
import type { AgentRun, Task } from "@/lib/types";

export function StandupPanel() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [result, setResult] = useState<AgentRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  // Load active (non-done, root) tasks for the selector
  useEffect(() => {
    api
      .listTasks()
      .then((all) => {
        const active = all.filter((t) => t.parentId === null && t.status !== "done");
        setTasks(active);
        if (active.length > 0) {
          const inProgress = active.find((t) => t.status === "in-progress");
          setSelectedId(String((inProgress ?? active[0]).id));
        }
      })
      .catch(() => {});
  }, []);

  async function generate() {
    if (!selectedId) return;
    setLoading(true);
    setUnavailable(false);
    try {
      const res = await api.statusUpdate({ taskId: Number(selectedId) });
      setResult(res);
    } catch (e) {
      if (e instanceof AgentUnavailableError) {
        setUnavailable(true);
      } else {
        toast.error((e as Error).message);
      }
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    if (!result) return;
    navigator.clipboard.writeText(result.output).then(() => toast.success("Copied to clipboard"));
  }

  if (unavailable) {
    return (
      <div className="rounded-lg border border-border bg-muted/40 p-4 text-center">
        <AlertCircle className="mx-auto mb-2 h-5 w-5 text-muted-foreground/60" />
        <p className="text-[13px] font-semibold text-foreground">AI agents unavailable</p>
        <p className="mt-1 text-[11.5px] text-muted-foreground">
          Set <code className="rounded bg-muted px-1 font-mono">GEMINI_API_KEY</code> in{" "}
          <code className="rounded bg-muted px-1 font-mono">Backend/.env</code> to enable agents.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div className="mb-3.5 flex flex-col gap-2.5 rounded-lg border border-border bg-card p-3">
        <div>
          <p className="text-[13px] font-bold">Draft standup</p>
          <p className="text-[11px] text-muted-foreground">Slack-style async update for a task</p>
        </div>

        {tasks.length === 0 ? (
          <p className="text-[12px] text-muted-foreground">No open tasks to report on.</p>
        ) : (
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="text-[12px]">
              <SelectValue placeholder="Select a task…" />
            </SelectTrigger>
            <SelectContent>
              {tasks.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>
                  {t.title.length > 42 ? t.title.slice(0, 42) + "…" : t.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

      {result && (
        <>
          {/* Slack-style message card */}
          <div className="rounded-lg border border-border bg-card p-3.5">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary to-[hsl(240_70%_48%)]" />
              <span className="text-[13px] font-bold">you</span>
              <span className="font-mono text-[10.5px] text-muted-foreground/70">
                just now · #eng-updates
              </span>
            </div>
            <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-foreground/85">
              {result.output}
            </p>
          </div>

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
      )}
    </div>
  );
}
