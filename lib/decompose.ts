import type { DecomposeOutput } from "./types";
import { extractJson } from "./json";
import { sanitizeText } from "./sanitize";

export function parseDecomposeOutput(output: string): DecomposeOutput {
  try {
    const raw = JSON.parse(extractJson(output)) as DecomposeOutput;
    if (raw.status === "needs_clarification") {
      return { status: "needs_clarification", question: sanitizeText(raw.question, 500) };
    }
    return {
      status: "decomposed",
      subtasks: raw.subtasks.map((s) => ({
        title: sanitizeText(s.title, 200),
        ...(s.description ? { description: sanitizeText(s.description, 1000) } : {}),
        ...(s.priority ? { priority: s.priority } : {}),
        ...(s.estimation != null ? { estimation: s.estimation } : {}),
      })),
    };
  } catch {
    return { status: "decomposed", subtasks: [{ title: sanitizeText(output, 200) }] };
  }
}
