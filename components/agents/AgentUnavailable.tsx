import { AlertCircle } from "lucide-react";

export function AgentUnavailable() {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-4 text-center">
      <AlertCircle className="mx-auto mb-2 h-5 w-5 text-muted-foreground/60" />
      <p className="text-[13px] font-semibold text-foreground">
        AI agents unavailable
      </p>
      <p className="mt-1 text-[11.5px] text-muted-foreground">
        Set{" "}
        <code className="rounded bg-muted px-1 font-mono">GEMINI_API_KEY</code>{" "}
        in <code className="rounded bg-muted px-1 font-mono">Backend/.env</code>{" "}
        and restart the backend to enable agent features.
      </p>
    </div>
  );
}
