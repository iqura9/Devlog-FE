import type { StandupReport, StandupItem } from "./types";
import { extractJson } from "./json";
import { sanitizeText } from "./sanitize";
import { taskLabel } from "./format";

/**
 * Parses the status-update agent's `output` string into a typed `StandupReport`.
 * Returns null when the model returned something that isn't a recognisable report,
 * so callers can fall back to showing the raw text.
 */
export function parseStandupOutput(output: string): StandupReport | null {
  try {
    const obj = JSON.parse(extractJson(output)) as Partial<StandupReport> & {
      doneToday?: unknown;
      inProgress?: unknown;
      nextUp?: unknown;
      blockers?: unknown;
      planComparison?: {
        planned?: unknown;
        completed?: unknown;
        slipped?: unknown;
      };
    };

    if (!obj || typeof obj !== "object") return null;
    if (!Array.isArray(obj.doneToday) && !Array.isArray(obj.inProgress)) return null;

    function coerceItems(raw: unknown): StandupItem[] {
      if (!Array.isArray(raw)) return [];
      return raw.map((it: Partial<StandupItem>) => ({
        id: Number(it.id),
        title: sanitizeText(it.title, 200),
        status: (it.status ?? "todo") as StandupItem["status"],
      }));
    }

    const report: StandupReport = {
      date: sanitizeText(obj.date, 10) || new Date().toISOString().slice(0, 10),
      summary: sanitizeText(obj.summary, 300),
      doneToday: coerceItems(obj.doneToday),
      inProgress: coerceItems(obj.inProgress),
      nextUp: coerceItems(obj.nextUp),
      blockers: Array.isArray(obj.blockers)
        ? (obj.blockers as unknown[]).map((b) => sanitizeText(b, 300)).filter(Boolean)
        : [],
    };

    if (obj.planComparison) {
      report.planComparison = {
        planned: Number(obj.planComparison.planned ?? 0),
        completed: Number(obj.planComparison.completed ?? 0),
        slipped: coerceItems(obj.planComparison.slipped),
      };
    }

    return report;
  } catch {
    return null;
  }
}

/**
 * Formats a `StandupReport` as deterministic Slack-ready plain text.
 * Pass `baseUrl` (e.g. `window.location.origin`) to emit Slack-linked task refs
 * `<https://app/tasks/1|[DL-1]: title>`; omit it for plain `[DL-1]: title`.
 */
export function formatStandupForSlack(report: StandupReport, baseUrl = ""): string {
  const lines: string[] = [];

  function taskLine(item: StandupItem): string {
    const label = taskLabel(item.id, item.title);
    return baseUrl
      ? `• <${baseUrl}/tasks/${item.id}|${label}>`
      : `• ${label}`;
  }

  lines.push(`📋 *Standup — ${report.date}*`);
  lines.push(report.summary);
  lines.push("");

  if (report.doneToday.length > 0) {
    lines.push("*✅ Done today*");
    for (const item of report.doneToday) lines.push(taskLine(item));
    lines.push("");
  }

  if (report.inProgress.length > 0) {
    lines.push("*🔄 In progress*");
    for (const item of report.inProgress) lines.push(taskLine(item));
    lines.push("");
  }

  if (report.nextUp.length > 0) {
    lines.push("*📋 Next up*");
    for (const item of report.nextUp) lines.push(taskLine(item));
    lines.push("");
  }

  if (report.blockers.length > 0) {
    lines.push("*🚧 Blockers*");
    for (const blocker of report.blockers) lines.push(`• ${blocker}`);
    lines.push("");
  }

  if (report.planComparison) {
    const { planned, completed, slipped } = report.planComparison;
    lines.push(
      `_Plan: ${planned} task${planned !== 1 ? "s" : ""} planned · ${completed} done · ${slipped.length} slipped_`,
    );
  }

  return lines.join("\n").trim();
}
