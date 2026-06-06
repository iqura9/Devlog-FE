import type { TriageReport, TriageItem, TriageAction } from "./types";
import { extractJson } from "./json";
import { sanitizeText } from "./sanitize";

export function parseTriageOutput(output: string): TriageReport | null {
  try {
    const obj = JSON.parse(extractJson(output)) as Partial<TriageReport> & {
      stale?: unknown;
    };
    if (!obj || typeof obj !== "object") return null;
    if (!Array.isArray(obj.stale)) return null;

    const VALID_ACTIONS = new Set<TriageAction>([
      "raise_priority", "split", "close", "escalate", "monitor",
    ]);

    function coerceItem(it: Partial<TriageItem>): TriageItem {
      const action: TriageAction = VALID_ACTIONS.has(it.action as TriageAction)
        ? (it.action as TriageAction)
        : "monitor";
      const item: TriageItem = {
        id: Number(it.id),
        title: sanitizeText(it.title, 200),
        status: (it.status ?? "todo") as TriageItem["status"],
        priority: (it.priority ?? "medium") as TriageItem["priority"],
        daysSinceUpdate: Number(it.daysSinceUpdate ?? 0),
        diagnosis: sanitizeText(it.diagnosis, 300),
        action,
        applied: Boolean(it.applied),
      };
      if (it.changes) item.changes = sanitizeText(it.changes, 300);
      return item;
    }

    return {
      date: sanitizeText(obj.date, 10) || new Date().toISOString().slice(0, 10),
      thresholdDays: Number(obj.thresholdDays ?? 7),
      summary: sanitizeText(obj.summary, 300),
      stale: (obj.stale as Partial<TriageItem>[]).map(coerceItem),
      healthy: Number(obj.healthy ?? 0),
      applied: Boolean(obj.applied),
    };
  } catch {
    return null;
  }
}
