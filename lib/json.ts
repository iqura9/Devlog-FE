/**
 * Strips an LLM response down to its JSON payload. Handles ```json fenced blocks and any
 * preamble text before the first `{`.
 */
export function extractJson(raw: string): string {
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) return fence[1].trim();
  const braceStart = raw.indexOf("{");
  return braceStart >= 0 ? raw.slice(braceStart) : raw.trim();
}
