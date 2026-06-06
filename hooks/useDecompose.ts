"use client";

import { useReducer } from "react";
import { toast } from "sonner";
import { api, AgentUnavailableError } from "@/lib/api";
import { parseDecomposeOutput } from "@/lib/decompose";
import type { DecomposeSubtask, Task } from "@/lib/types";

export type DecomposePhase = "idle" | "loading" | "clarify" | "suggest" | "applying";

type State = {
  phase: DecomposePhase;
  question: string;
  answer: string;
  suggestions: DecomposeSubtask[];
  selected: Set<number>;
  refinement: string;
  error: string;
};

export type Action =
  | { type: "START_LOADING" }
  | { type: "SET_CLARIFY"; question: string }
  | { type: "SET_SUGGEST"; suggestions: DecomposeSubtask[] }
  | { type: "SET_ANSWER"; answer: string }
  | { type: "SET_REFINEMENT"; refinement: string }
  | { type: "TOGGLE"; index: number }
  | { type: "REMOVE_SUGGESTION"; index: number }
  | { type: "START_APPLYING" }
  | { type: "DONE_APPLYING" }
  | { type: "APPLY_FAILED" }
  | { type: "SET_ERROR"; error: string }
  | { type: "RESET" };

const INITIAL_STATE: State = {
  phase: "idle",
  question: "",
  answer: "",
  suggestions: [],
  selected: new Set(),
  refinement: "",
  error: "",
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "START_LOADING":
      return { ...state, phase: "loading", error: "" };
    case "SET_CLARIFY":
      return { ...state, phase: "clarify", question: action.question, answer: "" };
    case "SET_SUGGEST": {
      const selected = new Set(action.suggestions.map((_, i) => i));
      return { ...state, phase: "suggest", suggestions: action.suggestions, selected, refinement: "" };
    }
    case "SET_ANSWER":
      return { ...state, answer: action.answer };
    case "SET_REFINEMENT":
      return { ...state, refinement: action.refinement };
    case "TOGGLE": {
      const next = new Set(state.selected);
      if (next.has(action.index)) next.delete(action.index);
      else next.add(action.index);
      return { ...state, selected: next };
    }
    case "REMOVE_SUGGESTION": {
      const suggestions = state.suggestions.filter((_, j) => j !== action.index);
      const selected = new Set<number>();
      state.selected.forEach((v) => {
        if (v < action.index) selected.add(v);
        else if (v > action.index) selected.add(v - 1);
      });
      return { ...state, suggestions, selected };
    }
    case "START_APPLYING":
      return { ...state, phase: "applying" };
    case "DONE_APPLYING":
      return { ...state, phase: "idle" };
    case "APPLY_FAILED":
      return { ...state, phase: "suggest" };
    case "SET_ERROR":
      return { ...state, phase: "idle", error: action.error };
    case "RESET":
      return { ...state, phase: "idle" };
  }
}

export function useDecompose(task: Task, onApplied: (created: Task[]) => void) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  async function run(clarification?: string) {
    dispatch({ type: "START_LOADING" });
    try {
      const res = await api.decompose({
        taskId: task.id,
        ...(clarification ? { clarification } : {}),
      });
      const parsed = parseDecomposeOutput(res.output);
      if (parsed.status === "needs_clarification") {
        dispatch({ type: "SET_CLARIFY", question: parsed.question });
      } else {
        dispatch({ type: "SET_SUGGEST", suggestions: parsed.subtasks ?? [] });
      }
    } catch (e) {
      dispatch({
        type: "SET_ERROR",
        error:
          e instanceof AgentUnavailableError
            ? "AI agents require a GEMINI_API_KEY in Backend/.env"
            : (e as Error).message,
      });
    }
  }

  async function apply() {
    const toCreate = state.suggestions.filter((_, i) => state.selected.has(i));
    if (!toCreate.length) {
      toast.error("Select at least one subtask");
      return;
    }
    dispatch({ type: "START_APPLYING" });
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
      dispatch({ type: "DONE_APPLYING" });
    } catch (e) {
      toast.error((e as Error).message);
      dispatch({ type: "APPLY_FAILED" });
    }
  }

  return { ...state, dispatch, run, apply };
}
