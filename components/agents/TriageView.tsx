"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { taskLabel } from "@/lib/format";
import { PriorityBadge } from "@/components/badges";
import { Links, resolvePath } from "@/routes/paths";
import type { TriageReport, TriageItem, TriageAction } from "@/lib/types";

interface TriageViewProps {
  report: TriageReport;
}

export function TriageView({ report }: TriageViewProps) {
  if (report.stale.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-6 text-center">
        <CheckCircle2 className="h-5 w-5 text-status-done" />
        <p className="text-[13px] font-medium">Backlog is healthy</p>
        <p className="text-[11.5px] text-muted-foreground">
          No tasks idle for more than {report.thresholdDays}d
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3.5 py-2.5">
        <p className="text-[13px] font-bold leading-snug">{report.summary}</p>
        <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
          {report.healthy} healthy
        </span>
      </div>

      <ul className="flex flex-col divide-y divide-border/50">
        {report.stale.map((item) => (
          <TriageItemRow key={item.id} item={item} applied={report.applied} />
        ))}
      </ul>
    </div>
  );
}

interface TriageItemRowProps {
  item: TriageItem;
  applied: boolean;
}

function TriageItemRow({ item, applied }: TriageItemRowProps) {
  return (
    <li className="flex flex-col gap-1 px-3.5 py-2.5">
      <div className="flex items-start gap-2">
        <Link
          href={resolvePath(Links.tasks.view, { id: item.id })}
          target="_blank"
          className="flex-1 truncate font-mono text-[12px] transition-colors hover:text-primary"
          title={item.title}
        >
          {taskLabel(item.id, item.title)}
        </Link>
        <span className="shrink-0 font-mono text-[10.5px] text-muted-foreground/60">
          {item.daysSinceUpdate}d idle
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <PriorityBadge priority={item.priority} />
        <ActionBadge action={item.action} />
        {applied && item.applied ? (
          <span className="rounded bg-status-done-soft px-1.5 py-0.5 text-[10px] font-medium text-status-done">
            ✓ applied
          </span>
        ) : null}
      </div>

      <p className="text-[11.5px] text-muted-foreground">{item.diagnosis}</p>

      {item.applied && item.changes ? (
        <p className="text-[11px] italic text-muted-foreground/70">{item.changes}</p>
      ) : null}
    </li>
  );
}

interface ActionBadgeProps {
  action: TriageAction;
}

const ACTION_LABELS: Record<TriageAction, string> = {
  raise_priority: "raise priority",
  split: "split",
  close: "close",
  escalate: "escalate",
  monitor: "monitor",
};

function ActionBadge({ action }: ActionBadgeProps) {
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 text-[10px] font-medium",
        action === "raise_priority" && "bg-priority-high-soft text-priority-high",
        action === "split"          && "bg-accent text-accent-foreground",
        action === "close"          && "bg-status-done-soft text-status-done",
        action === "escalate"       && "bg-priority-medium-soft text-priority-medium",
        action === "monitor"        && "bg-muted text-muted-foreground/70",
      )}
    >
      {ACTION_LABELS[action]}
    </span>
  );
}
