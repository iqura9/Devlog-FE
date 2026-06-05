"use client";

import { Sparkles, ListChecks, Clock, MessageSquareDot } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlanDay } from "@/components/agents/PlanDay";
import { StaleTriage } from "@/components/agents/StaleTriage";
import { StandupPanel } from "@/components/agents/StandupPanel";

interface AgentPanelProps {
  onChanged: () => void;
}

export function AgentPanel({ onChanged }: AgentPanelProps) {
  return (
    <aside className="sticky top-4 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="flex items-center gap-2.5 border-b border-border bg-gradient-to-br from-accent/70 to-card p-4">
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-accent-foreground/20 bg-accent text-accent-foreground">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <h2 className="text-[14.5px] font-bold tracking-tight">Agent</h2>
          <p className="text-[11.5px] text-muted-foreground">Multi-step helpers over your tasks</p>
        </div>
      </div>

      <Tabs defaultValue="plan">
        <TabsList className="px-3 pt-2">
          <TabsTrigger value="plan">
            <ListChecks /> Plan day
          </TabsTrigger>
          <TabsTrigger value="standup">
            <MessageSquareDot /> Standup
          </TabsTrigger>
          <TabsTrigger value="triage">
            <Clock /> Triage
          </TabsTrigger>
        </TabsList>

        <div className="scroll-thin max-h-[calc(100vh-9rem)] overflow-y-auto p-4">
          <TabsContent value="plan" forceMount className="data-[state=inactive]:hidden">
            <PlanDay />
          </TabsContent>
          <TabsContent value="standup" forceMount className="data-[state=inactive]:hidden">
            <StandupPanel />
          </TabsContent>
          <TabsContent value="triage" forceMount className="data-[state=inactive]:hidden">
            <StaleTriage onChanged={onChanged} />
          </TabsContent>
        </div>
      </Tabs>
    </aside>
  );
}
