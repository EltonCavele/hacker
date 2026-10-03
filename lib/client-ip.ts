import { isIP } from "node:net";

/**
 * Client IP as seen by the outermost trusted proxy. `TRUSTED_PROXY_HOPS` is how many reverse proxies sit in front of
 * the app (default 1: Railway, Vercel, nginx...); each one appends the address it saw to X-Forwarded-For, so the
 * entry that many places from the right cannot be forged by the client. Use 0 when the app is exposed directly.
 */
export function getClientIp(request: Request): string {
  // Read directly (already validated at boot) so a request can never fail on unrelated config problems.
  const parsed = Number(process.env.TRUSTED_PROXY_HOPS || 1);
  const hops = Number.isInteger(parsed) && parsed >= 0 ? parsed : 1;
  if (hops > 0) {
    const forwarded =
      request.headers
        .get("x-forwarded-for")
        ?.split(",")
        .map((part) => part.trim()) ?? [];
    const candidate = forwarded[forwarded.length - hops];
    if (candidate && isIP(candidate)) return candidate;
    const realIp = request.headers.get("x-real-ip");
    if (realIp && isIP(realIp)) return realIp;
  }
  return "unknown";
}
