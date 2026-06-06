/**
 * Strips an LLM response down to its JSON payload. Handles ```json fenced blocks, preamble/trailing
 * prose, and responses that leak several competing JSON objects — in which case the model's final
 * answer is the LAST complete top-level object, so that is what we return.
 */
export function extractJson(raw: string): string {
  const objects = topLevelObjects(raw);
  if (objects.length > 0) return objects[objects.length - 1];

  // No balanced object found — fall back to fenced content, then the raw string, so the
  // caller's JSON.parse fails cleanly and surfaces the original text.
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) return fence[1].trim();
  return raw.trim();
}

/** Scans for balanced top-level `{...}` objects, respecting strings and escape sequences. */
function topLevelObjects(raw: string): string[] {
  const objects: string[] = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];

    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}") {
      if (depth > 0) {
        depth--;
        if (depth === 0 && start >= 0) {
          objects.push(raw.slice(start, i + 1));
          start = -1;
        }
      }
    }
  }

  return objects;
}
