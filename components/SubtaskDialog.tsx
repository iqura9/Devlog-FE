"use client";

import { Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Markdown } from "@/components/Markdown";
import { PriorityBadge, StatusBadge } from "@/components/badges";
import { formatHours } from "@/lib/format";
import type { Task } from "@/lib/types";

interface SubtaskDialogProps {
  subtask: Task | null;
  onClose: () => void;
}

export function SubtaskDialog({ subtask, onClose }: SubtaskDialogProps) {
  return (
    <Dialog open={subtask !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        {subtask ? (
          <>
            <DialogHeader>
              <DialogTitle className="pr-8 leading-snug">
                {subtask.title}
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={subtask.status} />
              <PriorityBadge priority={subtask.priority} />
              {subtask.estimation != null ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatHours(subtask.estimation)}h
                </span>
              ) : null}
            </div>

            <div>
              <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                Description
              </p>
              {subtask.description.trim() ? (
                <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-border/50 bg-background/50 p-4">
                  <Markdown>{subtask.description}</Markdown>
                </div>
              ) : (
                <p className="text-[13.5px] italic text-muted-foreground/60">
                  No description yet.
                </p>
              )}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
