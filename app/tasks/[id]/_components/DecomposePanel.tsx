"use client";

import {
  AlertCircle,
  RotateCcw,
  Sparkles,
  Wand2,
  X,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentTrace } from "@/components/agents/AgentTrace";
import { cn } from "@/lib/utils";
import type { useDecompose } from "@/hooks/useDecompose";

interface DecomposePanelProps {
  decompose: ReturnType<typeof useDecompose>;
}

export function DecomposePanel({ decompose }: DecomposePanelProps) {
  return (
    <div
      className="mt-4 rounded-xl p-[1.5px]"
      style={{
        background:
          "linear-gradient(135deg, hsl(222 83% 56%), hsl(270 60% 55%))",
      }}
    >
      <div className="rounded-[calc(0.7rem-1.5px)] bg-card p-4">
        {decompose.phase === "loading" ? (
          <div>
            <AgentTrace
              steps={["Assess clarity", "Generate", "Review"]}
              state="running"
            />
            <p className="mt-3 text-center text-[13px] text-muted-foreground">
              Agent is analysing the task…
            </p>
          </div>
        ) : null}

        {decompose.phase === "clarify" ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-[13px] font-semibold text-primary">
                  Agent needs a bit more context
                </p>
                <p className="mt-0.5 text-[13.5px]">{decompose.question}</p>
              </div>
            </div>
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring"
              value={decompose.answer}
              onChange={(e) =>
                decompose.dispatch({
                  type: "SET_ANSWER",
                  answer: e.target.value,
                })
              }
              placeholder="Your answer (optional)…"
              onKeyDown={(e) => {
                if (e.key === "Enter") decompose.run(decompose.answer);
              }}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => decompose.dispatch({ type: "RESET" })}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={() => decompose.run(decompose.answer)}>
                <Wand2 className="h-3.5 w-3.5" />
                Generate subtasks
              </Button>
            </div>
          </div>
        ) : null}

        {["suggest", "applying"].includes(decompose.phase) ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <p className="text-[13px] font-semibold text-primary">
                Suggested subtasks
              </p>
            </div>

            <ul className="flex flex-col gap-1.5">
              {decompose.suggestions.map((s, i) => (
                <li
                  key={i}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-[13px] transition-colors",
                    decompose.selected.has(i)
                      ? "border-primary/30 bg-primary/5"
                      : "border-dashed border-border text-muted-foreground",
                  )}
                  onClick={() =>
                    decompose.dispatch({ type: "TOGGLE", index: i })
                  }
                >
                  <div
                    className={cn(
                      "grid h-4 w-4 shrink-0 place-items-center rounded-[5px] border-[1.5px]",
                      decompose.selected.has(i)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border",
                    )}
                  >
                    {decompose.selected.has(i) ? (
                      <Check className="h-2.5 w-2.5" strokeWidth={4} />
                    ) : null}
                  </div>
                  <span className="flex-1">{s.title}</span>
                  {s.estimation != null ? (
                    <span className="font-mono text-[10px] text-muted-foreground/70">
                      {s.estimation}h
                    </span>
                  ) : null}
                  {s.priority ? (
                    <span className="font-mono text-[10px] text-muted-foreground/70">
                      {s.priority}
                    </span>
                  ) : null}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      decompose.dispatch({
                        type: "REMOVE_SUGGESTION",
                        index: i,
                      });
                    }}
                    className="ml-1 grid h-5 w-5 shrink-0 place-items-center rounded text-muted-foreground/40 hover:bg-muted hover:text-muted-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>

            <input
              className="w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-[13px] text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              value={decompose.refinement}
              onChange={(e) =>
                decompose.dispatch({
                  type: "SET_REFINEMENT",
                  refinement: e.target.value,
                })
              }
              placeholder="Ask AI to refine suggestions…"
              onKeyDown={(e) => {
                if (e.key === "Enter" && decompose.refinement.trim())
                  decompose.run(decompose.refinement);
              }}
            />

            <div className="flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={() => decompose.run()}
                disabled={decompose.phase === "applying"}
              >
                <RotateCcw className="h-3 w-3" />
                Regenerate
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => decompose.dispatch({ type: "RESET" })}
                  disabled={decompose.phase === "applying"}
                >
                  Discard
                </Button>
                <Button
                  size="sm"
                  onClick={decompose.apply}
                  disabled={
                    decompose.selected.size === 0 ||
                    decompose.phase === "applying"
                  }
                >
                  {decompose.phase === "applying"
                    ? "Adding…"
                    : `Add ${decompose.selected.size}`}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {decompose.error ? (
          <div className="flex items-center gap-2 rounded-lg bg-muted/60 p-3 text-[13px]">
            <AlertCircle className="h-4 w-4 shrink-0 text-muted-foreground/60" />
            <span className="text-muted-foreground">{decompose.error}</span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => decompose.dispatch({ type: "RESET" })}
            >
              Dismiss
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
