import type { Priority, Status, Tone } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

export function ageInDays(iso: string): number {
  return Math.max(
    0,
    Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS),
  );
}

/** "today", "3d old", "9d old" — compact age label. */
export function ageLabel(iso: string): string {
  const d = ageInDays(iso);
  if (d === 0) return "today";
  return `${d}d old`;
}

export function idleLabel(iso: string): string {
  const d = ageInDays(iso);
  if (d === 0) return "active today";
  return `idle ${d}d`;
}

export function formatHours(hours: number): string {
  return hours % 1 === 0 ? String(hours) : hours.toFixed(1);
}

export const STATUS_LABELS: Record<Status, string> = {
  todo: "Todo",
  "in-progress": "In progress",
  done: "Done",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "low",
  medium: "medium",
  high: "high",
};

export const TONE_LABELS: Record<Tone, string> = {
  technical: "Technical",
  casual: "Casual",
  formal: "Formal",
};
