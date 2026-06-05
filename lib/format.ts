import type { Priority, Status, Tone } from "./types";
import { STATUSES, PRIORITIES } from "./types";

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
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const TONE_LABELS: Record<Tone, string> = {
  technical: "Technical",
  casual: "Casual",
  formal: "Formal",
};

export const STATUS_OPTIONS = STATUSES.map((s) => ({
  value: s,
  label: STATUS_LABELS[s],
  triggerCls: {
    todo: "bg-muted text-muted-foreground/80 border-border/40",
    "in-progress":
      "bg-status-progress-soft text-status-progress border-transparent",
    done: "bg-status-done-soft text-status-done border-transparent",
  }[s],
  dotCls: {
    todo: "bg-muted-foreground/50",
    "in-progress": "bg-status-progress",
    done: "bg-status-done",
  }[s],
}));

export const PRIORITY_OPTIONS = PRIORITIES.map((p) => ({
  value: p,
  label: PRIORITY_LABELS[p],
  triggerCls: {
    high: "bg-priority-high-soft text-priority-high border-transparent",
    medium: "bg-priority-medium-soft text-priority-medium border-transparent",
    low: "bg-priority-low-soft text-priority-low border-transparent",
  }[p],
  dotCls: {
    high: "bg-priority-high",
    medium: "bg-priority-medium",
    low: "bg-priority-low",
  }[p],
}));
