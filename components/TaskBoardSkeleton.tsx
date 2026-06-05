import { Skeleton } from "@/components/ui/skeleton";

export function TaskBoardSkeleton() {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-xl border border-border bg-card p-1 shadow-soft">
          {["All", "Todo", "In progress", "Done"].map((label) => (
            <div
              key={label}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold text-muted-foreground"
            >
              {label}
              <Skeleton className="h-3 w-4 rounded" />
            </div>
          ))}
        </div>
        <div className="ml-auto">
          <Skeleton className="h-9 w-[190px] rounded-md" />
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
