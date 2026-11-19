import { parseAddress, type ParsedAddress } from "./address";
import { getConfig } from "./config";

const NO_STORE = { "Cache-Control": "no-store" };

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: NO_STORE });
}

export function apiError(status: number, message: string): Response {
  return json({ error: message }, status);
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Validates the `[address]` route segment against the configured domains. */
export function resolveInbox(raw: string): ParsedAddress | Response {
  return parseAddress(safeDecode(raw), getConfig().domains) ?? apiError(404, "Unknown inbox");
}

/**
 * Client IP used for rate limiting. Next.js sets `X-Forwarded-For` to the socket
 * address when it is absent, and reverse proxies (Caddy, nginx) append the real
 * client IP — so the right-most entry is the one we can trust. Run the app behind
 * a reverse proxy in production so clients cannot forge this header.
 */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",").at(-1)?.trim() || "unknown";
}

interface Bucket {
  count: number;
  resetAt: number;
}

const globalForLimits = globalThis as typeof globalThis & { __tempMailLimits?: Map<string, Bucket> };
const buckets = (globalForLimits.__tempMailLimits ??= new Map());

/**
 * Fixed-window, in-memory rate limiter. Returns a 429 response when the
 * client is over the limit, otherwise `null`.
 */
export function rateLimit(req: Request, name: string, max: number, windowMs = 60_000): Response | null {
  const now = Date.now();
  if (buckets.size > 50_000) {
    for (const [key, b] of buckets) if (b.resetAt <= now) buckets.delete(key);
  }

  const key = `${name}:${clientIp(req)}`;
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }
  if (++bucket.count <= max) return null;

  const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
  return Response.json(
    { error: "Too many requests" },
    { status: 429, headers: { ...NO_STORE, "Retry-After": String(retryAfter) } },
  );
}
