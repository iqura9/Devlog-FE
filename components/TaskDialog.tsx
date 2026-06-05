"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ControlledSelect } from "@/components/ui/ControlledSelect";
import { api } from "@/lib/api";
import { type Priority, type Status, type Task } from "@/lib/types";
import { STATUS_OPTIONS, PRIORITY_OPTIONS } from "@/lib/format";

interface TaskDialogProps {
  open: boolean;
  task: Task | null; // null → create mode
  onClose: () => void;
  onSaved: () => void;
}

export function TaskDialog({ open, task, onClose, onSaved }: TaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Status>("todo");
  const [priority, setPriority] = useState<Priority>("medium");
  const [saving, setSaving] = useState(false);

  // Re-seed the form whenever the dialog (re)opens or switches task — the React-idiomatic
  // "adjust state during render" reset rather than a setState-in-effect.
  const syncKey = open ? (task?.id ?? "new") : null;
  const [lastSync, setLastSync] = useState<number | "new" | null>(null);
  if (syncKey !== lastSync) {
    setLastSync(syncKey);
    if (open) {
      setTitle(task?.title ?? "");
      setDescription(task?.description ?? "");
      setStatus(task?.status ?? "todo");
      setPriority(task?.priority ?? "medium");
    }
  }

  async function save() {
    if (!title.trim()) {
      toast.error("Give the task a title");
      return;
    }
    setSaving(true);
    try {
      const payload = { title: title.trim(), description: description.trim(), status, priority };
      if (task) {
        await api.updateTask(task.id, payload);
        toast.success("Task updated");
      } else {
        await api.createTask(payload);
        toast.success("Task created");
      }
      onSaved();
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "New task"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              autoFocus
              placeholder="What needs doing?"
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              placeholder="Context, links, acceptance criteria…"
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <ControlledSelect
                value={status}
                onChange={(v) => setStatus(v as Status)}
                options={STATUS_OPTIONS}
                variant="pill"
                className="h-9 w-full rounded-md"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Priority</Label>
              <ControlledSelect
                value={priority}
                onChange={(v) => setPriority(v as Priority)}
                options={PRIORITY_OPTIONS}
                variant="pill"
                className="h-9 w-full rounded-md"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : task ? "Save changes" : "Create task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
