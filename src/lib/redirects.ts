/**
 * Only same-site paths are allowed as a post-login destination, so a crafted
 * `?callbackUrl=https://evil.example/steal` can't send someone to another website.
 * Absolute URLs (Auth.js adds them) are reduced to their path on this site.
 */
export function safeCallbackUrl(value: unknown, fallback = "/app") {
  if (typeof value !== "string" || !value) return fallback;
  let path = value;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) {
    if (!/^https?:\/\//i.test(value)) return fallback; // javascript:, data:, …
    try {
      const url = new URL(value);
      path = url.pathname + url.search;
    } catch {
      return fallback;
    }
  }
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(path)) return fallback;
  return path === "/" ? fallback : path;
}
