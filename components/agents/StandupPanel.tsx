"use client";

import { useSyncExternalStore, useState } from "react";
import { Copy, Info, MessageSquare, Play, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AgentTrace } from "@/components/agents/AgentTrace";
import { AgentUnavailable } from "@/components/agents/AgentUnavailable";
import { StandupView } from "@/components/agents/StandupView";
import { ModelBadge } from "@/components/badges";
import { Markdown } from "@/components/Markdown";
import { api } from "@/lib/api";
import { parsePlanOutput } from "@/lib/plan";
import { parseStandupOutput, formatStandupForSlack } from "@/lib/standup";
import { useAgentRun } from "@/hooks/useAgentRun";

const PLAN_STORAGE_KEY = "devlog:plan-my-day";
const STANDUP_STORAGE_KEY = "devlog:standup";

function getSavedPlan() {
  try {
    const raw = localStorage.getItem(PLAN_STORAGE_KEY);
    if (!raw) return null;
    const run = JSON.parse(raw) as { output: string };
    return parsePlanOutput(run.output);
  } catch {
    return null;
  }
}

// useSyncExternalStore is the React-approved way to read external stores (like localStorage)
// without setState-in-effect issues. Server snapshot = true so no hint flashes during SSR.
const noop = () => () => {};
const clientSnapshot = () => Boolean(getSavedPlan());
const serverSnapshot = () => true;

export function StandupPanel() {
  const hasPlan = useSyncExternalStore(noop, clientSnapshot, serverSnapshot);
  const [redoNote, setRedoNote] = useState<string | null>(null);

  const { run, loading, result, unavailable } = useAgentRun(
    (notes?: string) => {
      const plan = getSavedPlan();
      return api.statusUpdate({
        ...(plan ? { plan: { items: plan.items, totalHours: plan.totalHours, focus: plan.focus } } : {}),
        ...(notes ? { notes } : {}),
      });
    },
    { storageKey: STANDUP_STORAGE_KEY },
  );

  function copy() {
    if (!result) return;
    const report = parseStandupOutput(result.output);
    const text = report
      ? formatStandupForSlack(report, window.location.origin)
      : result.output;
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success("Copied to clipboard"));
  }

  function handleRedo() {
    setRedoNote("");
  }

  function confirmRedo() {
    const notes = redoNote?.trim() || undefined;
    setRedoNote(null);
    run(notes);
  }

  function cancelRedo() {
    setRedoNote(null);
  }

  if (unavailable) {
    return <AgentUnavailable />;
  }

  const report = result ? parseStandupOutput(result.output) : null;

  return (
    <div>
      <div className="mb-3.5 flex items-center gap-3 rounded-lg border border-border bg-card p-2.5 pl-3">
        <div className="flex-1">
          <p className="text-[13px] font-bold">Draft standup</p>
          <p className="text-[11px] text-muted-foreground">
            Summarises today&apos;s work across all tasks
          </p>
        </div>
        <Button size="sm" onClick={() => run()} disabled={loading || redoNote !== null}>
          <Play className="h-3.5 w-3.5" />
          {loading ? "Generating…" : "Generate"}
        </Button>
      </div>

      {!hasPlan && !result && !loading ? (
        <div className="mb-3 flex items-start gap-1.5 rounded-md border border-border/50 bg-muted/40 px-3 py-2">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
          <p className="text-[11.5px] text-muted-foreground">
            Run <span className="font-semibold">Plan my day</span> first to enable planned-vs-actual comparison.
          </p>
        </div>
      ) : null}

      <AgentTrace
        steps={["Gather today's work", "Compare to plan", "Compose"]}
        state={loading ? "running" : result ? "done" : "idle"}
      />

      {result ? (
        <>
          {report ? (
            <StandupView report={report} />
          ) : (
            <div className="rounded-lg border border-border bg-card p-3.5">
              <Markdown>{result.output}</Markdown>
            </div>
          )}

          {redoNote !== null ? (
            <div className="mt-2.5 rounded-lg border border-border bg-card p-3">
              <p className="mb-1.5 text-[12px] font-medium">
                What&apos;s wrong? Why redo?
              </p>
              <textarea
                autoFocus
                value={redoNote}
                onChange={(e) => setRedoNote(e.target.value)}
                placeholder="Optional — describe what to fix or improve…"
                rows={2}
                className="w-full resize-none rounded-md border border-border bg-background px-2.5 py-1.5 text-[12px] placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <div className="mt-2 flex justify-end gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 px-2 text-[11.5px]"
                  onClick={cancelRedo}
                >
                  <X className="h-3 w-3" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-7 gap-1 px-2.5 text-[11.5px]"
                  onClick={confirmRedo}
                  disabled={loading}
                >
                  <RotateCcw className="h-3 w-3" />
                  Redo
                </Button>
              </div>
            </div>
          ) : (
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
                  onClick={handleRedo}
                  disabled={loading}
                >
                  <MessageSquare className="h-3 w-3" />
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
          )}
        </>
      ) : null}
    </div>
  );
}
