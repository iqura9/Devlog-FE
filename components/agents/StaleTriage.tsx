"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Play, AlertCircle, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentTrace } from "@/components/agents/AgentTrace";
import { ModelBadge } from "@/components/badges";
import { Markdown } from "@/components/Markdown";
import { api, AgentUnavailableError } from "@/lib/api";
import type { AgentRun } from "@/lib/types";

interface StaleTriageProps {
  onChanged: () => void;
}

export function StaleTriage({ onChanged }: StaleTriageProps) {
  const [result, setResult] = useState<AgentRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [thresholdDays] = useState(7);

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
      await api.sweepStale({ thresholdDays, apply: true });
      toast.success("Safe fixes applied");
      onChanged();
      await scan();
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
    return (
      <div className="rounded-lg border border-border bg-muted/40 p-4 text-center">
        <AlertCircle className="mx-auto mb-2 h-5 w-5 text-muted-foreground/60" />
        <p className="text-[13px] font-semibold text-foreground">AI agents unavailable</p>
        <p className="mt-1 text-[11.5px] text-muted-foreground">
          Set <code className="rounded bg-muted px-1 font-mono">GEMINI_API_KEY</code> in{" "}
          <code className="rounded bg-muted px-1 font-mono">Backend/.env</code> and restart the
          backend to enable agent features.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3.5 flex items-center gap-3 rounded-lg border border-border bg-card p-2.5 pl-3">
        <div className="flex-1">
          <p className="text-[13px] font-bold">Stale triage</p>
          <p className="text-[11px] text-muted-foreground">
            Idle &gt; {thresholdDays}d · diagnose + fix
          </p>
        </div>
        <Button size="sm" onClick={scan} disabled={loading || applying}>
          <Play className="h-3.5 w-3.5" />
          {loading ? "Scanning…" : "Scan"}
        </Button>
      </div>

      <AgentTrace
        steps={["Scan idle", "Diagnose", "Recommend"]}
        state={loading ? "running" : result ? "done" : "idle"}
      />

      {result ? (
        <>
          <div className="rounded-lg border border-border bg-card p-3.5">
            <Markdown>{result.output}</Markdown>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-mono text-[10.5px] text-muted-foreground/70">
              <span>{result.steps.length} tool call{result.steps.length !== 1 ? "s" : ""}</span>
              <ModelBadge model={result.model} />
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1.5 px-2.5 text-[11.5px] text-accent-foreground"
              onClick={applyFixes}
              disabled={applying || loading}
            >
              <Wrench className="h-3.5 w-3.5" />
              {applying ? "Applying…" : "Apply safe fixes"}
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
