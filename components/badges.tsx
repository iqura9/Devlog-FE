import { cn } from "@/lib/utils";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/format";
import type { Priority, Status } from "@/lib/types";

export function StatusBadge({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    todo: "bg-muted text-muted-foreground border-border",
    "in-progress":
      "bg-status-progress-soft text-status-progress border-transparent",
    done: "bg-status-done-soft text-status-done border-transparent",
  };
  const dot: Record<Status, string> = {
    todo: "bg-muted-foreground/50",
    "in-progress": "bg-status-progress",
    done: "bg-status-done",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold min-w-[110px] justify-center",
        styles[status],
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dot[status])} />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const styles: Record<Priority, string> = {
    high: "bg-priority-high-soft text-priority-high",
    medium: "bg-priority-medium-soft text-priority-medium",
    low: "bg-priority-low-soft text-priority-low",
  };
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 font-mono text-[10.5px] font-semibold uppercase tracking-wider",
        styles[priority],
      )}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

/** Shows which Gemini model serviced the agent request. */
export function ModelBadge({ model }: { model: string }) {
  return (
    <span
      className="rounded-md px-1.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-wider bg-accent text-accent-foreground"
      title={model}
    >
      {model}
    </span>
  );
}
