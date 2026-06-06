import type { DayPlan } from "./types";
import { extractJson } from "./json";
import { sanitizeText } from "./sanitize";

/**
 * Parses the prioritize agent's `output` string into a typed `DayPlan`. Returns null when the
 * model returned something that isn't a recognisable plan object, so callers can fall back to
 * showing the raw text.
 */
export function parsePlanOutput(output: string): DayPlan | null {
  try {
    const obj = JSON.parse(extractJson(output)) as Partial<DayPlan>;
    if (!obj || !Array.isArray(obj.items)) return null;
    return {
      items: obj.items.map((it) => ({
        id: Number(it.id),
        title: sanitizeText(it.title, 200),
        hours: Number(it.hours ?? 0),
        assumed: Boolean(it.assumed),
      })),
      focus: sanitizeText(obj.focus, 300),
      totalHours:
        typeof obj.totalHours === "number"
          ? obj.totalHours
          : (obj.items ?? []).reduce((sum, it) => sum + Number(it.hours ?? 0), 0),
      ...(obj.note ? { note: sanitizeText(obj.note, 500) } : {}),
    };
  } catch {
    return null;
  }
}
