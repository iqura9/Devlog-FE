import type { DecomposeOutput } from "./types";

/**
 * Strips an LLM response down to its JSON payload. Handles ```json fenced blocks and any
 * preamble text before the first `{`.
 */
function extractJson(raw: string): string {
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) return fence[1].trim();
  const braceStart = raw.indexOf("{");
  return braceStart >= 0 ? raw.slice(braceStart) : raw.trim();
}

/**
 * Parses the decompose agent's `output` string into a typed `DecomposeOutput`. Falls back to a
 * single-subtask suggestion when the model returns non-JSON prose.
 */
export function parseDecomposeOutput(output: string): DecomposeOutput {
  try {
    return JSON.parse(extractJson(output)) as DecomposeOutput;
  } catch {
    return { status: "decomposed", subtasks: [{ title: output }] };
  }
}
