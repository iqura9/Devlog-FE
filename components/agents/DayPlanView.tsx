"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { formatHours, taskLabel } from "@/lib/format";
import { Links, resolvePath } from "@/routes/paths";
import type { DayPlan } from "@/lib/types";

interface DayPlanViewProps {
  plan: DayPlan;
}

export function DayPlanView({ plan }: DayPlanViewProps) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3.5 py-2.5">
        <p className="text-[13px] font-bold leading-snug">
          {plan.focus || "Today's plan"}
        </p>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatHours(plan.totalHours)}h
        </span>
      </div>

      {plan.items.length > 0 ? (
        <ol className="flex flex-col">
          {plan.items.map((item, i) => (
            <li
              key={item.id}
              className="flex items-center gap-2.5 border-b border-border/50 px-3.5 py-2 last:border-b-0"
            >
              <span className="w-4 shrink-0 text-center font-mono text-[11px] text-muted-foreground/50">
                {i + 1}
              </span>
              <Link
                href={resolvePath(Links.tasks.view, { id: item.id })}
                target="_blank"
                className="flex-1 truncate text-[13px] transition-colors hover:text-primary"
                title={item.title}
              >
                <span className="font-mono text-[11px] ">
                  {taskLabel(item.id, item.title)}
                </span>
              </Link>
              <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[11px] text-muted-foreground">
                {formatHours(item.hours)}h
                {item.assumed ? (
                  <span
                    className="rounded bg-muted px-1 text-[9px] uppercase tracking-wide text-muted-foreground/60"
                    title="Estimated by the agent"
                  >
                    est
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="px-3.5 py-3 text-[13px] text-muted-foreground">
          No tasks to plan right now.
        </p>
      )}

      {plan.note ? (
        <p className="border-t border-border px-3.5 py-2 text-[12px] text-muted-foreground">
          {plan.note}
        </p>
      ) : null}
    </div>
  );
}
