/** App path safe to use after login. Rejects off-site and protocol-relative URLs. */
export function safeAppPath(value: string | null | undefined, fallback = "/dashboard") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("://")) {
    return fallback;
  }
  let url: URL;
  try {
    url = new URL(value, "http://local");
  } catch {
    return fallback;
  }
  if (url.origin !== "http://local" || url.username || url.password) return fallback;
  let pathname: string;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return fallback;
  }
  if (!pathname.startsWith("/") || pathname.startsWith("//") || pathname.includes("\\")) return fallback;
  if (pathname.startsWith("/login") || pathname.startsWith("/api")) return fallback;
  return `${url.pathname}${url.search}`;
}
