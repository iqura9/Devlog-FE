"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AgentUnavailableError } from "@/lib/api";

interface UseAgentRunOptions {
  /** When set, the latest result is persisted to localStorage under this key and rehydrated on mount. */
  storageKey?: string;
}

interface UseAgentRunResult<T, A extends unknown[]> {
  run: (...args: A) => Promise<void>;
  loading: boolean;
  result: T | null;
  unavailable: boolean;
  setResult: (value: T | null) => void;
  /** Drops the current result (and removes it from localStorage when a storageKey is set). */
  clear: () => void;
}

/**
 * Wraps the boilerplate shared by every agent panel: loading flag, result state, and the
 * `AgentUnavailableError` → "unavailable" empty-state branch (everything else is toasted).
 *
 * Pass `{ storageKey }` to persist the result across reloads.
 */
export function useAgentRun<T, A extends unknown[] = []>(
  fn: (...args: A) => Promise<T>,
  options?: UseAgentRunOptions,
): UseAgentRunResult<T, A> {
  const storageKey = options?.storageKey;
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<T | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  // Rehydrate after mount (kept out of the initial state to avoid SSR hydration mismatches).
  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setResult(JSON.parse(raw) as T);
    } catch {
      // ignore malformed/unavailable storage
    }
  }, [storageKey]);

  const run = useCallback(
    async (...args: A) => {
      setLoading(true);
      setUnavailable(false);
      try {
        const value = await fn(...args);
        setResult(value);
        if (storageKey) {
          try {
            localStorage.setItem(storageKey, JSON.stringify(value));
          } catch {
            // ignore quota/availability errors — persistence is best-effort
          }
        }
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
    [fn, storageKey],
  );

  const clear = useCallback(() => {
    setResult(null);
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
    }
  }, [storageKey]);

  return { run, loading, result, unavailable, setResult, clear };
}
