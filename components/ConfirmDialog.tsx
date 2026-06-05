"use client";

import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  /** The trigger — clicking it opens the confirmation dialog. */
  children: ReactNode;
  /** Runs only when the user confirms. Awaited so the dialog can show a pending state. */
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Style the confirm action as destructive (default true — most confirms are deletes). */
  destructive?: boolean;
}

/**
 * Wraps any clickable child in an "Are you sure?" gate. The child is used as the
 * dialog trigger; `onConfirm` fires only when the user clicks confirm, and the
 * dialog closes itself afterward (or stays open if `onConfirm` throws).
 */
export function ConfirmDialog({
  children,
  onConfirm,
  title = "Are you sure?",
  description = "This action can't be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = true,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    setPending(true);
    try {
      await onConfirm();
      setOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={pending}
            onClick={handleConfirm}
          >
            {pending ? "Working…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
