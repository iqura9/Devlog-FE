"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { MessageSquareText, Copy, RotateCcw, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AgentTrace } from "@/components/agents/AgentTrace";
import { ModelBadge } from "@/components/badges";
import { api, AgentUnavailableError } from "@/lib/api";
import { TONE_LABELS } from "@/lib/format";
import type { AgentRun, TaskWithSubtasks, Tone } from "@/lib/types";

const TONES: Tone[] = ["technical", "casual", "formal"];

interface StatusUpdateDialogProps {
  open: boolean;
  task: TaskWithSubtasks | null;
  onClose: () => void;
  onChanged: () => void;
}

export function StatusUpdateDialog({ open, task, onClose }: StatusUpdateDialogProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentRun | null>(null);
  const [tone, setTone] = useState<Tone | "auto">("auto");
  const [notes, setNotes] = useState("");
  const [unavailable, setUnavailable] = useState(false);

  const run = useCallback(
    async (forcedTone?: Tone) => {
      if (!task) return;
      setLoading(true);
      setUnavailable(false);
      try {
        const res = await api.statusUpdate({
          taskId: task.id,
          notes: notes.trim() || undefined,
          tone: forcedTone,
        });
        setResult(res);
      } catch (e) {
        if (e instanceof AgentUnavailableError) {
          setUnavailable(true);
        } else {
          toast.error((e as Error).message);
        }
      } finally {
        setLoading(false);
      }
    },
    [task, notes]
  );

  useEffect(() => {
    if (open && task) {
      setTone("auto");
      setNotes("");
      run();
    }
  }, [open, task]); // eslint-disable-line react-hooks/exhaustive-deps

  function copy() {
    if (!result) return;
    navigator.clipboard.writeText(result.output).then(() => toast.success("Copied to clipboard"));
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquareText className="h-4 w-4 text-primary" />
            Status update
            {result ? (
              <span className="ml-1">
                <ModelBadge model={result.model} />
              </span>
            ) : null}
          </DialogTitle>
          <DialogDescription className="line-clamp-1">{task?.title}</DialogDescription>
        </DialogHeader>

        <AgentTrace
          steps={["Gather context", "Pick tone", "Compose"]}
          state={loading ? "running" : result ? "done" : "idle"}
        />

        {unavailable ? (
          <div className="rounded-lg border border-border bg-muted/40 p-4 text-center">
            <AlertCircle className="mx-auto mb-2 h-5 w-5 text-muted-foreground/60" />
            <p className="text-[13px] font-semibold">AI agents unavailable</p>
            <p className="mt-1 text-[11.5px] text-muted-foreground">
              Set <code className="rounded bg-muted px-1 font-mono">GEMINI_API_KEY</code> in{" "}
              <code className="rounded bg-muted px-1 font-mono">Backend/.env</code> to enable agents.
            </p>
          </div>
        ) : (
          <>
            {/* Notes input */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                placeholder="Add any context or blockers to include in the update…"
                className="min-h-[60px]"
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Tone selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tone
              </span>
              <Select
                value={tone}
                onValueChange={(v) => {
                  const t = v as Tone | "auto";
                  setTone(t);
                  run(t === "auto" ? undefined : t);
                }}
              >
                <SelectTrigger className="h-8 w-[170px] text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (agent picks)</SelectItem>
                  {TONES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TONE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Update preview */}
            <div className="rounded-lg border border-border bg-card p-3.5">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary to-[hsl(240_70%_48%)]" />
                <span className="text-[13px] font-bold">you</span>
                <span className="font-mono text-[10.5px] text-muted-foreground/70">
                  just now · #eng-updates
                </span>
              </div>
              {loading ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Drafting…</p>
              ) : result ? (
                <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-foreground/85">
                  {result.output}
                </p>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => run(tone === "auto" ? undefined : tone)}
                disabled={loading}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Regenerate
              </Button>
              <Button size="sm" onClick={copy} disabled={loading || !result}>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
