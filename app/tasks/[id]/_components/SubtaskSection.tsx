"use client";

import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Task } from "@/lib/types";
import type { useSubtasks } from "@/hooks/useSubtasks";
import type { useDecompose } from "@/hooks/useDecompose";
import { useSubtaskInlineEdit } from "../_hooks/useSubtaskInlineEdit";
import { useAddSubtask } from "../_hooks/useAddSubtask";
import { SubtaskItem } from "./SubtaskItem";
import { AddSubtaskInput } from "./AddSubtaskInput";
import { DecomposePanel } from "./DecomposePanel";

interface SubtaskSectionProps {
  subs: ReturnType<typeof useSubtasks>;
  decompose: ReturnType<typeof useDecompose>;
  highlightedSubtaskId?: number;
  onViewSubtask: (sub: Task) => void;
}

export function SubtaskSection({
  subs,
  decompose,
  highlightedSubtaskId,
  onViewSubtask,
}: SubtaskSectionProps) {
  const inlineEdit = useSubtaskInlineEdit(subs.saveTitle);
  const addSubtask = useAddSubtask(subs.addSubtask);
  const highlightedSubtaskRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    highlightedSubtaskRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, []);

  const doneCount = subs.subtasks.filter((s) => s.status === "done").length;

  return (
    <div className="border-t border-border px-6 py-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[14px] font-bold">Subtasks</span>
          <span className="font-mono text-[12px] text-muted-foreground">
            {doneCount}/{subs.subtasks.length}
          </span>
          {subs.subtasks.length > 0 ? (
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-status-done transition-all duration-300"
                style={{
                  width: `${Math.round((doneCount / subs.subtasks.length) * 100)}%`,
                }}
              />
            </div>
          ) : null}
        </div>
        {decompose.phase === "idle" ? (
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 border-primary/40 px-3 text-[11.5px] text-primary hover:border-primary hover:bg-primary/5"
            onClick={() => decompose.run()}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Decompose
          </Button>
        ) : null}
      </div>

      {subs.subtasks.length > 0 ? (
        <ul className="mb-3 flex flex-col gap-2">
          {subs.subtasks.map((sub) => (
            <SubtaskItem
              key={sub.id}
              sub={sub}
              itemRef={sub.id === highlightedSubtaskId ? highlightedSubtaskRef : undefined}
              isHighlighted={sub.id === highlightedSubtaskId}
              inlineEdit={inlineEdit}
              onChangeEstimation={subs.changeEstimation}
              onChangeStatus={subs.changeStatus}
              onDeleteSubtask={subs.deleteSubtask}
              onViewSubtask={onViewSubtask}
            />
          ))}
        </ul>
      ) : null}

      <AddSubtaskInput
        addingSubtask={addSubtask.addingSubtask}
        newSubtaskTitle={addSubtask.newSubtaskTitle}
        subtaskInputRef={addSubtask.subtaskInputRef}
        onChangeTitle={addSubtask.setNewSubtaskTitle}
        onAdd={addSubtask.handleAddSubtask}
        onCancel={addSubtask.cancel}
        onStartAdding={() => addSubtask.setAddingSubtask(true)}
      />

      {decompose.phase !== "idle" ? (
        <DecomposePanel decompose={decompose} />
      ) : null}
    </div>
  );
}
