"use client";

import { Play, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentTrace } from "@/components/agents/AgentTrace";
import { AgentUnavailable } from "@/components/agents/AgentUnavailable";
import { ModelBadge } from "@/components/badges";
import { Markdown } from "@/components/Markdown";
import { DayPlanView } from "@/components/agents/DayPlanView";
import { api } from "@/lib/api";
import { parsePlanOutput } from "@/lib/plan";
import { useAgentRun } from "@/hooks/useAgentRun";

const PLAN_STORAGE_KEY = "devlog:plan-my-day";

export function PlanDay() {
  const { run, loading, result, unavailable, clear } = useAgentRun(api.prioritize, {
    storageKey: PLAN_STORAGE_KEY,
  });

  if (unavailable) {
    return <AgentUnavailable />;
  }

  const plan = result ? parsePlanOutput(result.output) : null;

  return (
    <div>
      <div className="mb-3.5 flex items-center gap-3 rounded-lg border border-border bg-card p-2.5 pl-3">
        <div className="flex-1">
          <p className="text-[13px] font-bold">Plan my day</p>
          <p className="text-[11px] text-muted-foreground">Ranks open tasks into a 7-8h day</p>
        </div>
        <div className="flex items-center gap-1.5">
          {result && !loading ? (
            <Button size="sm" variant="ghost" onClick={clear} title="Clear saved plan">
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </Button>
          ) : null}
          <Button size="sm" onClick={run} disabled={loading}>
            {result ? (
              <RotateCcw className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            {loading ? "Thinking…" : result ? "Recalculate" : "Run"}
          </Button>
        </div>
      </div>

      <AgentTrace
        steps={["Extract signals", "Score heuristic", "LLM reason"]}
        state={loading ? "running" : result ? "done" : "idle"}
      />

      {result ? (
        <>
          {plan ? (
            <DayPlanView plan={plan} />
          ) : (
            // Fallback: model returned something we couldn't parse as a plan
            <div className="rounded-lg border border-border bg-card p-3.5">
              <Markdown>{result.output}</Markdown>
            </div>
          )}
          <div className="mt-3 flex items-center justify-center gap-1.5 font-mono text-[10.5px] text-muted-foreground/70">
            <span>{result.steps.length} tool call{result.steps.length !== 1 ? "s" : ""}</span>
            <ModelBadge model={result.model} />
          </div>
        </>
      ) : null}
    </div>
  );
}
