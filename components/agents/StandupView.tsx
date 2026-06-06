"use client";

import Link from "next/link";
import { taskLabel } from "@/lib/format";
import { Links, resolvePath } from "@/routes/paths";
import type { StandupReport } from "@/lib/types";

interface StandupViewProps {
  report: StandupReport;
}

export function StandupView({ report }: StandupViewProps) {
  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Slack-style header */}
      <div className="flex items-center gap-2 border-b border-border px-3.5 py-2.5">
        <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary to-[hsl(240_70%_48%)]" />
        <span className="text-[13px] font-bold">you</span>
        <span className="font-mono text-[10.5px] text-muted-foreground/70">
          {report.date} · #eng-updates
        </span>
      </div>

      {/* Summary headline */}
      <div className="border-b border-border px-3.5 py-2.5">
        <p className="text-[13px] leading-snug text-foreground/85">{report.summary}</p>
      </div>

      {/* Done today */}
      {report.doneToday.length > 0 ? (
        <Section label="✅ Done today">
          {report.doneToday.map((item) => (
            <TaskRow key={item.id} item={item} />
          ))}
        </Section>
      ) : null}

      {/* In progress */}
      {report.inProgress.length > 0 ? (
        <Section label="🔄 In progress">
          {report.inProgress.map((item) => (
            <TaskRow key={item.id} item={item} />
          ))}
        </Section>
      ) : null}

      {/* Next up */}
      {report.nextUp.length > 0 ? (
        <Section label="📋 Next up">
          {report.nextUp.map((item) => (
            <TaskRow key={item.id} item={item} />
          ))}
        </Section>
      ) : null}

      {/* Blockers */}
      {report.blockers.length > 0 ? (
        <Section label="🚧 Blockers">
          {report.blockers.map((b, i) => (
            <li key={i} className="px-3.5 py-1.5 font-mono text-[12px] text-foreground/80">
              {b}
            </li>
          ))}
        </Section>
      ) : null}

      {/* Plan comparison */}
      {report.planComparison ? (
        <div className="border-t border-border px-3.5 py-2 font-mono text-[11px] text-muted-foreground">
          Plan: {report.planComparison.planned} task{report.planComparison.planned !== 1 ? "s" : ""} planned
          {" · "}
          {report.planComparison.completed} done
          {report.planComparison.slipped.length > 0 ? (
            <span className="text-amber-500/80">
              {" · "}{report.planComparison.slipped.length} slipped
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

interface SectionProps {
  label: string;
  children: React.ReactNode;
}

function Section({ label, children }: SectionProps) {
  return (
    <div className="border-t border-border/50">
      <p className="px-3.5 pt-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/60">
        {label}
      </p>
      <ul className="flex flex-col pb-1">{children}</ul>
    </div>
  );
}

interface TaskRowProps {
  item: { id: number; title: string };
}

function TaskRow({ item }: TaskRowProps) {
  return (
    <li className="flex items-center gap-2 px-3.5 py-1">
      <Link
        href={resolvePath(Links.tasks.view, { id: item.id })}
        target="_blank"
        className="flex-1 truncate font-mono text-[12px] transition-colors hover:text-primary"
        title={item.title}
      >
        {taskLabel(item.id, item.title)}
      </Link>
    </li>
  );
}
