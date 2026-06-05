"use client";

import Link from "next/link";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Links } from "@/routes/paths";

interface ErrorDisplayProps {
  onRetry: () => void;
  digest?: string;
}

export function ErrorDisplay({ onRetry, digest }: ErrorDisplayProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-sm text-center">
        <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100">
          <Flame className="h-8 w-8 text-orange-500" />
        </div>
        <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-orange-400">
          $ git blame
        </p>
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
          Oops. Someone&apos;s getting fired.
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Something broke in DevLog. We&apos;d blame the intern, but they&apos;re on vacation.
        </p>
        {digest ? (
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">
            evidence: {digest}
          </p>
        ) : null}
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={onRetry}>Try to reload</Button>
          <Button variant="outline" asChild>
            <Link href={Links.tasks.index}>← Back to DevLog</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
