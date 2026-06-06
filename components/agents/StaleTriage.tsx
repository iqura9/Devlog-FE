"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Play, RotateCcw, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentTrace } from "@/components/agents/AgentTrace";
import { AgentUnavailable } from "@/components/agents/AgentUnavailable";
import { TriageView } from "@/components/agents/TriageView";
import { ModelBadge } from "@/components/badges";
import { Markdown } from "@/components/Markdown";
import { api, AgentUnavailableError } from "@/lib/api";
import { parseTriageOutput } from "@/lib/triage";
import type { AgentRun } from "@/lib/types";

const thresholdDays = 7;

interface StaleTriageProps {
  onChanged: () => void;
}

export function StaleTriage({ onChanged }: StaleTriageProps) {
  const [result, setResult] = useState<AgentRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  async function scan() {
    setLoading(true);
    setUnavailable(false);
    try {
      setResult(await api.sweepStale({ thresholdDays }));
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

  async function applyFixes() {
    setApplying(true);
    try {
      const applied = await api.sweepStale({ thresholdDays, apply: true });
      setResult(applied);
      onChanged();
      toast.success("Safe fixes applied");
    } catch (e) {
      if (e instanceof AgentUnavailableError) {
        setUnavailable(true);
      } else {
        toast.error((e as Error).message);
      }
    } finally {
      setApplying(false);
    }
  }

  if (unavailable) {
    return <AgentUnavailable />;
  }

  const report = result ? parseTriageOutput(result.output) : null;
  const hasStale = report ? report.stale.length > 0 : false;
  const alreadyApplied = report?.applied ?? false;

  return (
    <div>
      <div className="mb-3.5 flex items-center gap-3 rounded-lg border border-border bg-card p-2.5 pl-3">
        <div className="flex-1">
          <p className="text-[13px] font-bold">Triage</p>
          <p className="text-[11px] text-muted-foreground">
            Idle &gt; {thresholdDays}d · diagnose + fix
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {result && !loading ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1 px-2 text-[11.5px]"
              onClick={scan}
              disabled={applying}
            >
              <RotateCcw className="h-3 w-3" />
              Rescan
            </Button>
          ) : null}
          <Button size="sm" onClick={scan} disabled={loading || applying}>
            <Play className="h-3.5 w-3.5" />
            {loading ? "Scanning…" : "Scan"}
          </Button>
        </div>
      </div>

      <AgentTrace
        steps={["Scan idle tasks", "Diagnose", "Recommend"]}
        state={loading || applying ? "running" : result ? "done" : "idle"}
      />

      {result ? (
        <>
          {report ? (
            <TriageView report={report} />
          ) : (
            <div className="rounded-lg border border-border bg-card p-3.5">
              <Markdown>{result.output}</Markdown>
            </div>
          )}

          <div className="mt-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-mono text-[10.5px] text-muted-foreground/70">
              <span>
                {result.steps.length} tool call
                {result.steps.length !== 1 ? "s" : ""}
              </span>
              <ModelBadge model={result.model} />
            </div>

            {hasStale && !alreadyApplied ? (
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 px-2.5 text-[11.5px]"
                onClick={applyFixes}
                disabled={applying || loading}
              >
                <Wrench className="h-3 w-3" />
                {applying ? "Applying…" : "Apply safe fixes"}
              </Button>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
