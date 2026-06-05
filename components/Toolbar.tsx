"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const SORTS: { key: SortKey; label: string }[] = [
  { key: "priority", label: "Priority" },
  { key: "createdAt", label: "Newest" },
  { key: "updatedAt", label: "Recently updated" },
];

export function Toolbar({ filter, setFilter, counts, sort, setSort }: ToolbarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="flex gap-1 rounded-xl border border-border bg-card p-1 shadow-soft">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors",
              filter === f.key
                ? "bg-background text-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
            <span
              className={cn(
                "font-mono text-[11px]",
                filter === f.key ? "text-accent-foreground" : "text-muted-foreground/60"
              )}
            >
              {counts[f.key]}
            </span>
          </button>
        ))}
      </div>

      <div className="ml-auto">
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-[190px]">
            <span className="text-muted-foreground">Sort</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (
              <SelectItem key={s.key} value={s.key}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
