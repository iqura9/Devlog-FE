"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { AgentUnavailableError } from "@/lib/api";

interface UseAgentRunResult<T, A extends unknown[]> {
  run: (...args: A) => Promise<void>;
  loading: boolean;
  result: T | null;
  unavailable: boolean;
  setResult: (value: T | null) => void;
}

/**
 * Wraps the boilerplate shared by every agent panel: loading flag, result state, and the
 * `AgentUnavailableError` → "unavailable" empty-state branch (everything else is toasted).
 */
export function useAgentRun<T, A extends unknown[] = []>(
  fn: (...args: A) => Promise<T>,
): UseAgentRunResult<T, A> {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<T | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  const run = useCallback(
    async (...args: A) => {
      setLoading(true);
      setUnavailable(false);
      try {
        setResult(await fn(...args));
      } catch (e) {
        if (e instanceof AgentUnavailableError) {
          setUnavailable(true);
        } else {
          toast.error((e as Error).message);
        }
      } finally {
        setLoading(false);
      }
    },
    [fn],
  );

  return { run, loading, result, unavailable, setResult };
}
