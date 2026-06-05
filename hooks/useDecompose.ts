"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api, AgentUnavailableError } from "@/lib/api";
import { parseDecomposeOutput } from "@/lib/decompose";
import type { DecomposeSubtask, Task } from "@/lib/types";

export type DecomposePhase = "idle" | "loading" | "clarify" | "suggest" | "applying";

/**
 * Drives the inline "decompose task" agent flow: a small state machine over the clarify →
 * suggest → apply phases. Created subtasks are handed back via `onApplied`.
 */
export function useDecompose(task: Task, onApplied: (created: Task[]) => void) {
  const [phase, setPhase] = useState<DecomposePhase>("idle");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [suggestions, setSuggestions] = useState<DecomposeSubtask[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [refinement, setRefinement] = useState("");
  const [error, setError] = useState("");

  function reset() {
    setPhase("idle");
  }

  async function run(clarification?: string) {
    setPhase("loading");
    setError("");
    try {
      const res = await api.decompose({
        taskId: task.id,
        ...(clarification ? { clarification } : {}),
      });
      const parsed = parseDecomposeOutput(res.output);
      if (parsed.status === "needs_clarification") {
        setQuestion(parsed.question);
        setAnswer("");
        setPhase("clarify");
      } else {
        const subs = parsed.subtasks ?? [];
        setSuggestions(subs);
        setSelected(new Set(subs.map((_, i) => i)));
        setRefinement("");
        setPhase("suggest");
      }
    } catch (e) {
      setError(
        e instanceof AgentUnavailableError
          ? "AI agents require a GEMINI_API_KEY in Backend/.env"
          : (e as Error).message,
      );
      setPhase("idle");
    }
  }

  async function apply() {
    const toCreate = suggestions.filter((_, i) => selected.has(i));
    if (!toCreate.length) {
      toast.error("Select at least one subtask");
      return;
    }
    setPhase("applying");
    try {
      const created = await Promise.all(
        toCreate.map((s) =>
          api.createSubtask(task.id, {
            title: s.title,
            description: s.description,
            priority: s.priority,
            estimation: s.estimation,
          }),
        ),
      );
      onApplied(created);
      toast.success(`Added ${created.length} subtask${created.length !== 1 ? "s" : ""}`);
      setPhase("idle");
    } catch (e) {
      toast.error((e as Error).message);
      setPhase("suggest");
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

  function removeSuggestion(i: number) {
    setSuggestions((prev) => prev.filter((_, j) => j !== i));
    setSelected((prev) => {
      const next = new Set<number>();
      prev.forEach((v) => {
        if (v < i) next.add(v);
        else if (v > i) next.add(v - 1);
      });
      return next;
    });
  }

  return {
    phase,
    question,
    answer,
    setAnswer,
    suggestions,
    selected,
    refinement,
    setRefinement,
    error,
    run,
    apply,
    toggle,
    removeSuggestion,
    reset,
  };
}
