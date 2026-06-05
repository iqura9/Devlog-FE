"use client";

import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentTrace } from "@/components/agents/AgentTrace";
import { AgentUnavailable } from "@/components/agents/AgentUnavailable";
import { ModelBadge } from "@/components/badges";
import { Markdown } from "@/components/Markdown";
import { api } from "@/lib/api";
import { useAgentRun } from "@/hooks/useAgentRun";

export function PlanDay() {
  const { run, loading, result, unavailable } = useAgentRun(api.prioritize);

  if (unavailable) {
    return <AgentUnavailable />;
  }

  return (
    <div>
      <div className="mb-3.5 flex items-center gap-3 rounded-lg border border-border bg-card p-2.5 pl-3">
        <div className="flex-1">
          <p className="text-[13px] font-bold">Plan my day</p>
          <p className="text-[11px] text-muted-foreground">Ranks open tasks with reasoning</p>
        </div>
        <Button size="sm" onClick={run} disabled={loading}>
          <Play className="h-3.5 w-3.5" />
          {loading ? "Thinking…" : "Run"}
        </Button>
      </div>

      <AgentTrace
        steps={["Extract signals", "Score heuristic", "LLM reason"]}
        state={loading ? "running" : result ? "done" : "idle"}
      />

      {result ? (
        <>
          <div className="rounded-lg border border-border bg-card p-3.5">
            <Markdown>{result.output}</Markdown>
          </div>
          <div className="mt-3 flex items-center justify-center gap-1.5 font-mono text-[10.5px] text-muted-foreground/70">
            <span>{result.steps.length} tool call{result.steps.length !== 1 ? "s" : ""}</span>
            <ModelBadge model={result.model} />
          </div>
        </>
      ) : null}
    </div>
  );
}
