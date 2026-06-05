"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onNewTask: () => void;
}

export function Header({ onNewTask }: HeaderProps) {
  return (
    <header className="flex items-center justify-between py-5">
      <div className="flex items-center gap-3.5">
        <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-[hsl(240_70%_48%)] text-primary-foreground shadow-card">
          <span className="text-xl font-extrabold tracking-tight">D</span>
        </div>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">DevLog</h1>
          <p className="-mt-0.5 font-mono text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground">
            AI task tracker
          </p>
        </div>
      </div>

      <Button onClick={onNewTask}>
        <Plus className="h-4 w-4" strokeWidth={2.4} />
        New task
      </Button>
    </header>
  );
}
