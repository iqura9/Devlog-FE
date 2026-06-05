"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Trash2,
  Wand2,
  Plus,
  X,
  Check,
  Sparkles,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { api, AgentUnavailableError } from "@/lib/api";
import type { Priority, Status, Task, DecomposeSubtask } from "@/lib/types";
import { STATUSES, PRIORITIES } from "@/lib/types";
import { STATUS_LABELS, PRIORITY_LABELS, ageLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AgentTrace } from "@/components/agents/AgentTrace";
import { cn } from "@/lib/utils";
import type { DecomposeOutput } from "@/lib/types";

// ── helpers ──────────────────────────────────────────────────────────────────

const PRIORITY_BORDER: Record<Priority, string> = {
  high: "border-l-priority-high",
  medium: "border-l-priority-medium",
  low: "border-l-priority-low",
};

const STATUS_TRIGGER_CLS: Record<Status, string> = {
  todo: "bg-muted text-muted-foreground/80 border-border/40",
  "in-progress": "bg-status-progress-soft text-status-progress border-transparent",
  done: "bg-status-done-soft text-status-done border-transparent",
};

const STATUS_DOT_CLS: Record<Status, string> = {
  todo: "bg-muted-foreground/50",
  "in-progress": "bg-status-progress",
  done: "bg-status-done",
};

function extractJson(raw: string): string {
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) return fence[1].trim();
  const braceStart = raw.indexOf("{");
  return braceStart >= 0 ? raw.slice(braceStart) : raw.trim();
}

// ── types ─────────────────────────────────────────────────────────────────────

type DecomposePhase = "idle" | "loading" | "clarify" | "suggest" | "applying";

// ── component ─────────────────────────────────────────────────────────────────

interface TaskDetailViewProps {
  initialTask: Task;
  initialSubtasks: Task[];
}

export function TaskDetailView({ initialTask, initialSubtasks }: TaskDetailViewProps) {
  const router = useRouter();

  const [task, setTask] = useState<Task | null>(initialTask);
  const [subtasks, setSubtasks] = useState<Task[]>(initialSubtasks);

  // Local edit state
  const [title, setTitle] = useState(initialTask.title);
  const [description, setDescription] = useState(initialTask.description);
  const [editingField, setEditingField] = useState<"title" | "desc" | null>(null);

  // Debounce refs
  const titleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const descTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Inline add-subtask
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const subtaskInputRef = useRef<HTMLInputElement>(null);

  // Subtask inline title editing
  const [editingSubtaskId, setEditingSubtaskId] = useState<number | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState("");

  // Inline decompose
  const [dPhase, setDPhase] = useState<DecomposePhase>("idle");
  const [dQuestion, setDQuestion] = useState("");
  const [dAnswer, setDAnswer] = useState("");
  const [dSuggestions, setDSuggestions] = useState<DecomposeSubtask[]>([]);
  const [dSelected, setDSelected] = useState<Set<number>>(new Set());
  const [dRefinement, setDRefinement] = useState("");
  const [dError, setDError] = useState("");

  // ── data ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (addingSubtask) subtaskInputRef.current?.focus();
  }, [addingSubtask]);

  // ── field save ──────────────────────────────────────────────────────────────

  async function saveField(field: "title" | "description", value: string) {
    if (!task) return;
    const trimmed = field === "title" ? value.trim() : value;
    if (field === "title" && !trimmed) return;
    if (field === "title" && trimmed === task.title) return;
    if (field === "description" && value === task.description) return;
    try {
      const updated = await api.updateTask(task.id, { [field]: trimmed });
      setTask(updated);
    } catch (e) {
      toast.error((e as Error).message);
      if (field === "title") setTitle(task.title);
    }
  }

  function handleTitleChange(v: string) {
    setTitle(v);
    clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(() => saveField("title", v), 500);
  }

  function handleDescChange(v: string) {
    setDescription(v);
    clearTimeout(descTimer.current);
    descTimer.current = setTimeout(() => saveField("description", v), 800);
  }

  // ── task mutations ──────────────────────────────────────────────────────────

  async function changeStatus(status: Status) {
    if (!task) return;
    try { setTask(await api.updateTask(task.id, { status })); }
    catch (e) { toast.error((e as Error).message); }
  }

  async function changePriority(priority: Priority) {
    if (!task) return;
    try { setTask(await api.updateTask(task.id, { priority })); }
    catch (e) { toast.error((e as Error).message); }
  }

  async function deleteTask() {
    if (!task || !confirm(`Delete "${task.title}"? This can't be undone.`)) return;
    try {
      await api.deleteTask(task.id);
      toast.success("Task deleted");
      router.push("/");
    } catch (e) { toast.error((e as Error).message); }
  }

  // ── subtask mutations ───────────────────────────────────────────────────────

  async function changeSubtaskStatus(subId: number, status: Status) {
    try {
      const updated = await api.updateTask(subId, { status });
      setSubtasks((prev) => prev.map((s) => s.id === subId ? updated : s));
    } catch (e) { toast.error((e as Error).message); }
  }

  async function saveSubtaskTitle(sub: Task) {
    const trimmed = editingSubtaskTitle.trim();
    setEditingSubtaskId(null);
    if (!trimmed || trimmed === sub.title) return;
    try {
      const updated = await api.updateTask(sub.id, { title: trimmed });
      setSubtasks((prev) => prev.map((s) => s.id === sub.id ? updated : s));
    } catch (e) { toast.error((e as Error).message); }
  }

  async function changeSubtaskEstimation(subId: number, value: string) {
    const hours = value === "" ? null : parseFloat(value);
    if (hours !== null && (isNaN(hours) || hours <= 0)) return;
    try {
      const updated = await api.updateTask(subId, { estimation: hours });
      setSubtasks((prev) => prev.map((s) => s.id === subId ? updated : s));
    } catch (e) { toast.error((e as Error).message); }
  }

  async function deleteSubtask(subId: number) {
    try {
      await api.deleteTask(subId);
      setSubtasks((prev) => prev.filter((s) => s.id !== subId));
    } catch (e) { toast.error((e as Error).message); }
  }

  async function addSubtask() {
    if (!task || !newSubtaskTitle.trim()) return;
    try {
      const sub = await api.createSubtask(task.id, { title: newSubtaskTitle.trim() });
      setSubtasks((prev) => [...prev, sub]);
      setNewSubtaskTitle("");
      setAddingSubtask(false);
    } catch (e) { toast.error((e as Error).message); }
  }

  // ── inline decompose ────────────────────────────────────────────────────────

  async function runDecompose(clarification?: string) {
    if (!task) return;
    setDPhase("loading");
    setDError("");
    try {
      const res = await api.decompose({
        taskId: task.id,
        ...(clarification ? { clarification } : {}),
      });
      let parsed: DecomposeOutput;
      try {
        parsed = JSON.parse(extractJson(res.output)) as DecomposeOutput;
      } catch {
        parsed = { status: "decomposed", subtasks: [{ title: res.output }] };
      }
      if (parsed.status === "needs_clarification") {
        setDQuestion(parsed.question);
        setDAnswer("");
        setDPhase("clarify");
      } else {
        const subs = parsed.subtasks ?? [];
        setDSuggestions(subs);
        setDSelected(new Set(subs.map((_, i) => i)));
        setDRefinement("");
        setDPhase("suggest");
      }
    } catch (e) {
      if (e instanceof AgentUnavailableError) {
        setDError("AI agents require a GEMINI_API_KEY in Backend/.env");
      } else {
        setDError((e as Error).message);
      }
      setDPhase("idle");
    }
  }

  async function applyDecompose() {
    if (!task) return;
    const toCreate = dSuggestions.filter((_, i) => dSelected.has(i));
    if (!toCreate.length) { toast.error("Select at least one subtask"); return; }
    setDPhase("applying");
    try {
      const created = await Promise.all(
        toCreate.map((s) => api.createSubtask(task.id, { title: s.title, priority: s.priority }))
      );
      setSubtasks((prev) => [...prev, ...created]);
      toast.success(`Added ${created.length} subtask${created.length !== 1 ? "s" : ""}`);
      setDPhase("idle");
    } catch (e) {
      toast.error((e as Error).message);
      setDPhase("suggest");
    }
  }

  function toggleSuggestion(i: number) {
    setDSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  if (!task) return null;

  const doneCount = subtasks.filter((s) => s.status === "done").length;
  const isRoot = task.parentId === null;

  return (
    <div className="mx-auto max-w-[1320px] px-5 pb-20 sm:px-7">
      {/* ── header ── */}
      <header className="flex items-center gap-3.5 py-5">
        <Link href="/" className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-[hsl(240_70%_48%)] text-primary-foreground shadow-card">
          <span className="text-xl font-extrabold tracking-tight">D</span>
        </Link>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">DevLog</h1>
          <p className="-mt-0.5 font-mono text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground">AI task tracker</p>
        </div>
      </header>

      <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />
        All tasks
      </Link>

      <div className="mt-4 grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_260px]">
        {/* ── main card ── */}
        <div className={cn(
          "overflow-hidden rounded-xl border border-border bg-card shadow-card",
          "border-l-4",
          PRIORITY_BORDER[task.priority]
        )}>
          <div className="p-6">
            {/* Title — debounced, shows outline on focus */}
            <input
              className={cn(
                "w-full bg-transparent text-[22px] font-extrabold tracking-tight",
                "rounded-lg border border-transparent px-2 py-1 -ml-2 -mt-1",
                "placeholder:text-muted-foreground/40 transition-all duration-150",
                "focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10",
                editingField === "title" && "border-primary/30 bg-primary/5"
              )}
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onFocus={() => setEditingField("title")}
              onBlur={() => { setEditingField(null); saveField("title", title); }}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              placeholder="Task title"
            />

            {/* Description */}
            <div className="mt-5">
              <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                Description
              </p>
              <Textarea
                className={cn(
                  "min-h-[100px] resize-none bg-transparent shadow-none transition-all duration-150",
                  "border-border/40 focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/10",
                  editingField === "desc" && "border-primary/30 bg-primary/5"
                )}
                value={description}
                onChange={(e) => handleDescChange(e.target.value)}
                onFocus={() => setEditingField("desc")}
                onBlur={() => { setEditingField(null); saveField("description", description); }}
                placeholder="Add context, links, acceptance criteria…"
              />
              {editingField === "desc" ? (
                <p className="mt-1 text-right font-mono text-[10px] text-muted-foreground/50">
                  Auto-saves on pause
                </p>
              ) : null}
            </div>
          </div>

          {/* ── subtasks ── */}
          {isRoot ? (
            <div className="border-t border-border px-6 py-5">
              {/* Header row */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[14px] font-bold">Subtasks</span>
                  <span className="font-mono text-[12px] text-muted-foreground">
                    {doneCount}/{subtasks.length}
                  </span>
                  {subtasks.length > 0 ? (
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-status-done transition-all duration-300"
                        style={{ width: `${Math.round((doneCount / subtasks.length) * 100)}%` }}
                      />
                    </div>
                  ) : null}
                </div>
                {dPhase === "idle" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1.5 border-primary/40 px-3 text-[11.5px] text-primary hover:border-primary hover:bg-primary/5"
                    onClick={() => runDecompose()}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Decompose
                  </Button>
                ) : null}
              </div>

              {/* Subtask cards */}
              {subtasks.length > 0 ? (
                <ul className="mb-3 flex flex-col gap-2">
                  {subtasks.map((sub) => {
                    const done = sub.status === "done";
                    const isEditingTitle = editingSubtaskId === sub.id;
                    return (
                      <li
                        key={sub.id}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-lg border border-border bg-background py-2 pl-3 pr-2.5",
                          "border-l-[3px]",
                          PRIORITY_BORDER[sub.priority]
                        )}
                      >
                        {/* Title — double-click to edit */}
                        {isEditingTitle ? (
                          <input
                            autoFocus
                            className="flex-1 rounded border border-primary/40 bg-primary/5 px-1.5 py-0.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={editingSubtaskTitle}
                            onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                            onBlur={() => saveSubtaskTitle(sub)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveSubtaskTitle(sub);
                              if (e.key === "Escape") setEditingSubtaskId(null);
                            }}
                          />
                        ) : (
                          <span
                            className={cn(
                              "flex-1 cursor-default select-none text-[13px]",
                              done && "text-muted-foreground/60 line-through"
                            )}
                            onDoubleClick={() => {
                              setEditingSubtaskId(sub.id);
                              setEditingSubtaskTitle(sub.title);
                            }}
                            title="Double-click to edit"
                          >
                            {sub.title}
                          </span>
                        )}

                        {/* Estimation — hours input */}
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0.5"
                            step="0.5"
                            className="w-14 rounded border border-border/60 bg-transparent px-1.5 py-0.5 text-center font-mono text-[11px] text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20"
                            value={sub.estimation ?? ""}
                            placeholder="—"
                            onChange={(e) => changeSubtaskEstimation(sub.id, e.target.value)}
                            title="Estimated hours"
                          />
                          <span className="text-[10px] text-muted-foreground/50">h</span>
                        </div>

                        {/* Colored status select */}
                        <Select
                          value={sub.status}
                          onValueChange={(v) => changeSubtaskStatus(sub.id, v as Status)}
                        >
                          <SelectTrigger
                            className={cn(
                              "h-6 w-auto gap-1.5 rounded-full border px-2.5 py-0 text-[11px] font-semibold shadow-none",
                              STATUS_TRIGGER_CLS[sub.status]
                            )}
                          >
                            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", STATUS_DOT_CLS[sub.status])} />
                            <span>{STATUS_LABELS[sub.status]}</span>
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((s) => (
                              <SelectItem key={s} value={s} className="text-[12px]">
                                {STATUS_LABELS[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Delete subtask */}
                        <button
                          onClick={() => deleteSubtask(sub.id)}
                          className="ml-1 grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted-foreground/40 opacity-0 transition-all group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                          aria-label="Delete subtask"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}

              {/* Add subtask */}
              {addingSubtask ? (
                <div className="flex items-center gap-2">
                  <input
                    ref={subtaskInputRef}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Subtask title…"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addSubtask();
                      if (e.key === "Escape") { setAddingSubtask(false); setNewSubtaskTitle(""); }
                    }}
                  />
                  <Button size="sm" onClick={addSubtask} disabled={!newSubtaskTitle.trim()}>Add</Button>
                  <button
                    onClick={() => { setAddingSubtask(false); setNewSubtaskTitle(""); }}
                    className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAddingSubtask(true)}
                  className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-[13px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add subtask
                </button>
              )}

              {/* ── inline decompose section ── */}
              {dPhase !== "idle" ? (
                <div className="mt-4 rounded-xl p-[1.5px]" style={{ background: "linear-gradient(135deg, hsl(222 83% 56%), hsl(270 60% 55%))" }}>
                  <div className="rounded-[calc(0.7rem-1.5px)] bg-card p-4">
                    {/* Loading */}
                    {dPhase === "loading" ? (
                      <div>
                        <AgentTrace
                          steps={["Assess clarity", "Generate", "Review"]}
                          state="running"
                        />
                        <p className="mt-3 text-center text-[13px] text-muted-foreground">
                          Agent is analysing the task…
                        </p>
                      </div>
                    ) : null}

                    {/* Clarify */}
                    {dPhase === "clarify" ? (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start gap-2">
                          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <div>
                            <p className="text-[13px] font-semibold text-primary">
                              Agent needs a bit more context
                            </p>
                            <p className="mt-0.5 text-[13.5px]">{dQuestion}</p>
                          </div>
                        </div>
                        <input
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring"
                          value={dAnswer}
                          onChange={(e) => setDAnswer(e.target.value)}
                          placeholder="Your answer (optional)…"
                          onKeyDown={(e) => { if (e.key === "Enter") runDecompose(dAnswer); }}
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setDPhase("idle")}>
                            Cancel
                          </Button>
                          <Button size="sm" onClick={() => runDecompose(dAnswer)}>
                            <Wand2 className="h-3.5 w-3.5" />
                            Generate subtasks
                          </Button>
                        </div>
                      </div>
                    ) : null}

                    {/* Suggestions */}
                    {(dPhase === "suggest" || dPhase === "applying") ? (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          <p className="text-[13px] font-semibold text-primary">Suggested subtasks</p>
                        </div>

                        <ul className="flex flex-col gap-1.5">
                          {dSuggestions.map((s, i) => (
                            <li
                              key={i}
                              className={cn(
                                "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-[13px] transition-colors cursor-pointer",
                                dSelected.has(i)
                                  ? "border-primary/30 bg-primary/5"
                                  : "border-dashed border-border text-muted-foreground"
                              )}
                              onClick={() => toggleSuggestion(i)}
                            >
                              <div className={cn(
                                "grid h-4 w-4 shrink-0 place-items-center rounded-[5px] border-[1.5px]",
                                dSelected.has(i)
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border"
                              )}>
                                {dSelected.has(i) ? <Check className="h-2.5 w-2.5" strokeWidth={4} /> : null}
                              </div>
                              <span className="flex-1">{s.title}</span>
                              {s.priority ? (
                                <span className="font-mono text-[10px] text-muted-foreground/70">
                                  {s.priority}
                                </span>
                              ) : null}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDSuggestions((prev) => prev.filter((_, j) => j !== i));
                                  setDSelected((prev) => {
                                    const next = new Set<number>();
                                    prev.forEach((v) => { if (v < i) next.add(v); else if (v > i) next.add(v - 1); });
                                    return next;
                                  });
                                }}
                                className="ml-1 grid h-5 w-5 shrink-0 place-items-center rounded text-muted-foreground/40 hover:bg-muted hover:text-muted-foreground"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </li>
                          ))}
                        </ul>

                        {/* Refine input */}
                        <input
                          className="w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-[13px] text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          value={dRefinement}
                          onChange={(e) => setDRefinement(e.target.value)}
                          placeholder="Ask AI to refine suggestions…"
                          onKeyDown={(e) => { if (e.key === "Enter" && dRefinement.trim()) runDecompose(dRefinement); }}
                        />

                        <div className="flex items-center justify-between gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => runDecompose()}
                            disabled={dPhase === "applying"}
                          >
                            <RotateCcw className="h-3 w-3" />
                            Regenerate
                          </Button>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDPhase("idle")}
                              disabled={dPhase === "applying"}
                            >
                              Discard
                            </Button>
                            <Button
                              size="sm"
                              onClick={applyDecompose}
                              disabled={dSelected.size === 0 || dPhase === "applying"}
                            >
                              {dPhase === "applying" ? "Adding…" : `Add ${dSelected.size}`}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Error fallback */}
                    {dError ? (
                      <div className="flex items-center gap-2 rounded-lg bg-muted/60 p-3 text-[13px]">
                        <AlertCircle className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                        <span className="text-muted-foreground">{dError}</span>
                        <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setDPhase("idle")}>
                          Dismiss
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* ── details sidebar ── */}
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <p className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              Details
            </p>
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-muted-foreground">Status</span>
                <Select value={task.status} onValueChange={(v) => changeStatus(v as Status)}>
                  <SelectTrigger className="h-7 w-[130px] text-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[13px] text-muted-foreground">Priority</span>
                <Select value={task.priority} onValueChange={(v) => changePriority(v as Priority)}>
                  <SelectTrigger className="h-7 w-[130px] text-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[13px] text-muted-foreground">Created</span>
                <span className="font-mono text-[12px] text-muted-foreground">
                  {ageLabel(task.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={deleteTask}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete task
          </button>
        </div>
      </div>
    </div>
  );
}
