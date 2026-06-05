"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Wand2, HelpCircle, Plus, RotateCcw, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AgentTrace } from "@/components/agents/AgentTrace";
import { ModelBadge } from "@/components/badges";
import { api, AgentUnavailableError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { DecomposeOutput, DecomposeSubtask, TaskWithSubtasks } from "@/lib/types";

type Phase = "loading" | "clarify" | "subtasks" | "error" | "unavailable";

interface DecomposeDialogProps {
  open: boolean;
  task: TaskWithSubtasks | null;
  onClose: () => void;
  onApplied: () => void;
}

export function DecomposeDialog({ open, task, onClose, onApplied }: DecomposeDialogProps) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [model, setModel] = useState("");
  const [question, setQuestion] = useState("");
  const [clarification, setClarification] = useState("");
  const [subtasks, setSubtasks] = useState<DecomposeSubtask[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [applying, setApplying] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const run = useCallback(
    async (withClarification?: string) => {
      if (!task) return;
      setPhase("loading");
      try {
        const res = await api.decompose({
          taskId: task.id,
          ...(withClarification ? { clarification: withClarification } : {}),
        });
        setModel(res.model);

        let parsed: DecomposeOutput;
        try {
          // LLMs sometimes wrap JSON in markdown code fences — strip them first.
          const raw = res.output.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
          // Also handle the case where JSON appears after preamble text
          const jsonStart = raw.indexOf("{");
          const clean = jsonStart > 0 ? raw.slice(jsonStart) : raw;
          parsed = JSON.parse(clean) as DecomposeOutput;
        } catch {
          // Fallback: treat the whole output as a single subtask suggestion
          parsed = { status: "decomposed", subtasks: [{ title: res.output }] };
        }

        if (parsed.status === "needs_clarification") {
          setQuestion(parsed.question);
          setClarification("");
          setPhase("clarify");
        } else {
          setSubtasks(parsed.subtasks ?? []);
          setSelected(new Set((parsed.subtasks ?? []).map((_, i) => i)));
          setPhase("subtasks");
        }
      } catch (e) {
        if (e instanceof AgentUnavailableError) {
          setPhase("unavailable");
        } else {
          setErrorMsg((e as Error).message);
          setPhase("error");
        }
      }
    },
    [task]
  );

  useEffect(() => {
    if (open && task) run();
  }, [open, task, run]);

  async function apply() {
    if (!task) return;
    const toCreate = subtasks.filter((_, i) => selected.has(i));
    if (toCreate.length === 0) {
      toast.error("Select at least one subtask");
      return;
    }
    setApplying(true);
    try {
      for (const sub of toCreate) {
        await api.createSubtask(task.id, {
          title: sub.title,
          description: sub.description,
          priority: sub.priority,
        });
      }
      toast.success(`Added ${toCreate.length} subtask${toCreate.length > 1 ? "s" : ""}`);
      onApplied();
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setApplying(false);
    }
  }

  function toggle(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" />
            Decompose task
            {model && (
              <span className="ml-1">
                <ModelBadge model={model} />
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="line-clamp-1">{task?.title}</DialogDescription>
        </DialogHeader>

        <AgentTrace
          steps={["Assess clarity", "Generate", "Review & add"]}
          state={phase === "loading" ? "running" : phase === "error" || phase === "unavailable" ? "idle" : "done"}
        />

        {phase === "loading" && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Agent is analysing the task…
          </p>
        )}

        {phase === "error" && (
          <div className="py-4 text-center text-sm text-destructive">{errorMsg}</div>
        )}

        {phase === "unavailable" && (
          <div className="rounded-lg border border-border bg-muted/40 p-4 text-center">
            <AlertCircle className="mx-auto mb-2 h-5 w-5 text-muted-foreground/60" />
            <p className="text-[13px] font-semibold">AI agents unavailable</p>
            <p className="mt-1 text-[11.5px] text-muted-foreground">
              Set <code className="rounded bg-muted px-1 font-mono">GEMINI_API_KEY</code> in{" "}
              <code className="rounded bg-muted px-1 font-mono">Backend/.env</code> to enable agents.
            </p>
          </div>
        )}

        {phase === "clarify" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-2 rounded-lg border border-accent-foreground/15 bg-accent/60 px-3 py-2.5 text-[13px] text-accent-foreground">
              <HelpCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                This task is a little vague — the agent wants a few details before breaking it down,
                rather than guessing.
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold">{question}</label>
              <Input
                value={clarification}
                placeholder="Your answer (optional)"
                onChange={(e) => setClarification(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={() => run(clarification)}>
                <Wand2 className="h-4 w-4" />
                Generate subtasks
              </Button>
            </div>
          </div>
        )}

        {phase === "subtasks" && (
          <div className="flex flex-col gap-3">
            <ul className="flex flex-col gap-1.5">
              {subtasks.map((s, i) => (
                <li key={i}>
                  <button
                    onClick={() => toggle(i)}
                    className={cn(
                      "flex w-full items-start gap-2.5 rounded-lg border px-3 py-2 text-left text-[13.5px] transition-colors",
                      selected.has(i)
                        ? "border-border bg-card"
                        : "border-dashed border-border bg-muted/40 text-muted-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-[5px] border-[1.5px] font-mono text-[10px]",
                        selected.has(i)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border"
                      )}
                    >
                      {selected.has(i) ? "✓" : ""}
                    </span>
                    <span className="flex-1">{s.title}</span>
                    {s.priority && (
                      <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                        {s.priority}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between gap-2">
              <Button variant="ghost" size="sm" onClick={() => run(clarification)}>
                <RotateCcw className="h-3.5 w-3.5" />
                Regenerate
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={apply} disabled={applying}>
                  <Plus className="h-4 w-4" />
                  {applying ? "Adding…" : `Add ${selected.size} to task`}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
