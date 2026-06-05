"use client";

import { ControlledSelect } from "@/components/ui/ControlledSelect";
import { cn } from "@/lib/utils";
import type { SortKey, StatusFilter } from "@/hooks/use-tasks";

interface ToolbarProps {
  filter: StatusFilter;
  setFilter: (f: StatusFilter) => void;
  counts: Record<StatusFilter, number>;
  sort: SortKey;
  setSort: (s: SortKey) => void;
}

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "todo", label: "Todo" },
  { key: "in-progress", label: "In progress" },
  { key: "done", label: "Done" },
];

const SORTS: { value: SortKey; label: string }[] = [
  { value: "priority", label: "Priority" },
  { value: "createdAt", label: "Newest" },
  { value: "updatedAt", label: "Recently updated" },
];

export function Toolbar({
  filter,
  setFilter,
  counts,
  sort,
  setSort,
}: ToolbarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="flex gap-1 rounded-xl border border-border bg-card p-1 shadow-soft">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors",
              filter === key
                ? "bg-background text-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
            <span
              className={cn(
                "font-mono text-[11px]",
                filter === key
                  ? "text-accent-foreground"
                  : "text-muted-foreground/60",
              )}
            >
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      <div className="ml-auto">
        <ControlledSelect
          value={sort}
          onChange={(v) => setSort(v as SortKey)}
          options={SORTS}
          className="w-47.5"
        />
      </div>
    </div>
  );
}
