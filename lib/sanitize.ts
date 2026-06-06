import DOMPurify from "dompurify";

const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

/**
 * Returns the URL only if it uses an allowed protocol.
 * Blocks javascript:, data:, vbscript:, etc.
 */
export function sanitizeUrl(url: string | undefined): string {
  if (!url) return "#";
  try {
    const { protocol } = new URL(url, "https://localhost");
    return SAFE_PROTOCOLS.has(protocol) ? url : "#";
  } catch {
    // Relative paths are safe
    return url.startsWith("/") || url.startsWith(".") ? url : "#";
  }
}

/**
 * Strips all HTML tags and XSS vectors from a value using DOMPurify,
 * then enforces a max length.
 */
export function sanitizeText(value: unknown, maxLen = 1000): string {
  return DOMPurify.sanitize(String(value ?? ""), {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  }).slice(0, maxLen);
}
