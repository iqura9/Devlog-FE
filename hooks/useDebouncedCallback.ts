"use client";

import { useEffect, useMemo, useRef } from "react";

interface DebouncedCallback<A extends unknown[]> {
  /** Schedule the callback to fire after the delay, replacing any pending call. */
  call: (...args: A) => void;
  /** Drop any pending call without firing it. */
  cancel: () => void;
}

/**
 * Returns a debounced wrapper around `fn`. Always calls the latest `fn` (no stale closures) and
 * cancels the pending timer on unmount. `cancel()` lets callers flush-then-save on blur without
 * a second delayed fire.
 */
export function useDebouncedCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  delay: number,
): DebouncedCallback<A> {
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const controls = useMemo<DebouncedCallback<A>>(() => {
    const cancel = () => clearTimeout(timer.current);
    return {
      cancel,
      call: (...args: A) => {
        cancel();
        timer.current = setTimeout(() => fnRef.current(...args), delay);
      },
    };
  }, [delay]);

  useEffect(() => controls.cancel, [controls]);

  return controls;
}
