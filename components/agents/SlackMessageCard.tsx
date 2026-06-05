interface SlackMessageCardProps {
  output: string;
  loading?: boolean;
}

export function SlackMessageCard({
  output,
  loading = false,
}: SlackMessageCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-3.5">
      <div className="mb-2 flex items-center gap-2">
        <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary to-[hsl(240_70%_48%)]" />
        <span className="text-[13px] font-bold">you</span>
        <span className="font-mono text-[10.5px] text-muted-foreground/70">
          just now · #eng-updates
        </span>
      </div>
      {loading ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Drafting…
        </p>
      ) : (
        <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-foreground/85">
          {output}
        </p>
      )}
    </div>
  );
}
