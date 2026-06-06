"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { type Priority, type Status } from "@/lib/types";
import { STATUS_OPTIONS, PRIORITY_OPTIONS } from "@/lib/format";

interface TaskDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

interface FormValues {
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  estimation: string;
}

export function TaskDialog({ open, onClose, onSaved }: TaskDialogProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { title: "", description: "", status: "todo", priority: "medium", estimation: "" },
  });

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  async function onSubmit(data: FormValues) {
    try {
      const estimation = data.estimation ? parseFloat(data.estimation) : undefined;
      await api.createTask({
        title: data.title.trim(),
        description: data.description.trim(),
        status: data.status,
        priority: data.priority,
        estimation:
          estimation !== undefined && !Number.isNaN(estimation) && estimation > 0
            ? estimation
            : undefined,
      });
      toast.success("Task created");
      onSaved();
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>New task</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                autoFocus
                placeholder="What needs doing?"
                {...register("title", { required: "Title is required" })}
              />
              {errors.title ? (
                <p className="text-[12px] text-destructive">{errors.title.message}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Context, links, acceptance criteria…"
                {...register("description")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <ControlledSelect
                control={control}
                name="status"
                label="Status"
                options={STATUS_OPTIONS}
                variant="pill"
                className="h-9 w-full rounded-md"
              />
              <ControlledSelect
                control={control}
                name="priority"
                label="Priority"
                options={PRIORITY_OPTIONS}
                variant="pill"
                className="h-9 w-full rounded-md"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="estimation">Estimation (hours)</Label>
              <Input
                id="estimation"
                type="number"
                min="0.5"
                step="0.5"
                placeholder="e.g. 4"
                {...register("estimation")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
