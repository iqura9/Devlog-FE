"use client";

import { useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { taskLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { useTaskEditor } from "@/hooks/useTaskEditor";

interface TaskEditPanelProps {
  taskId: number;
  editor: ReturnType<typeof useTaskEditor>;
}

export function TaskEditPanel({ taskId, editor }: TaskEditPanelProps) {
  const descRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = descRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [editor.description]);

  return (
    <div className="p-6">
      <span className="mb-2 block font-mono text-[11px] font-semibold text-muted-foreground/50">
        {taskLabel(taskId, "", true)}
      </span>

      <input
        className={cn(
          "w-full bg-transparent text-[22px] font-extrabold tracking-tight",
          "-ml-2 -mt-1 rounded-lg border border-transparent px-2 py-1",
          "placeholder:text-muted-foreground/40 transition-all duration-150",
          "focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10",
          editor.editingField === "title" && "border-primary/30 bg-primary/5",
        )}
        value={editor.title}
        onChange={(e) => editor.handleTitleChange(e.target.value)}
        onFocus={() => editor.setEditingField("title")}
        onBlur={editor.handleTitleBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        placeholder="Task title"
      />

      <div className="mt-5">
        <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
          Description
        </p>
        <Textarea
          ref={descRef}
          className={cn(
            "min-h-25 resize-none overflow-hidden bg-transparent shadow-none transition-all duration-150",
            "border-border/40 focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/10",
            editor.editingField === "desc" && "border-primary/30 bg-primary/5",
          )}
          value={editor.description}
          onChange={(e) => editor.handleDescChange(e.target.value)}
          onFocus={() => editor.setEditingField("desc")}
          onBlur={editor.handleDescBlur}
          placeholder="Add context, links, acceptance criteria…"
        />
        {editor.editingField === "desc" ? (
          <p className="mt-1 text-right font-mono text-[10px] text-muted-foreground/50">
            Auto-saves on pause
          </p>
        ) : null}
      </div>
    </div>
  );
}
