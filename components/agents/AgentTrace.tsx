import { cn } from "@/lib/utils";

interface AgentTraceProps {
  steps: string[];
  state: "idle" | "running" | "done";
}

/** Shows the multi-step progress of an agent run. */
export function AgentTrace({ steps, state }: AgentTraceProps) {
  return (
    <div className="mb-4 flex gap-1.5">
      {steps.map((label, i) => {
        const done = state === "done";
        const running = state === "running";
        return (
          <div key={label} className="flex-1 text-center">
            <span
              className={cn(
                "mb-1 block rounded-md py-0.5 font-mono text-[9.5px] font-semibold transition-colors",
                done && "bg-status-done-soft text-status-done",
                running && "animate-pulse bg-accent text-accent-foreground",
                state === "idle" && "bg-muted text-muted-foreground"
              )}
              style={running ? { animationDelay: `${i * 120}ms` } : undefined}
            >
              {done ? "✓" : `${i + 1}`}
            </span>
            <span className="text-[9.5px] font-semibold leading-tight text-muted-foreground">
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
