import { describe, expect, it } from "vitest";
import { buildCsp, cspOriginsFromEnv, staticSecurityHeaders } from "./security-headers";

const base = { nonce: "abc123", isDev: false, upgradeInsecure: true, connectOrigins: [], imageOrigins: [] };

describe("buildCsp", () => {
  it("allows scripts only through the per-request nonce", () => {
    const csp = buildCsp(base);
    expect(csp).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/);
  });

  it("forbids framing, plugins and foreign form targets", () => {
    const csp = buildCsp(base);
    for (const directive of ["frame-ancestors 'none'", "object-src 'none'", "base-uri 'self'", "form-action 'self'"]) {
      expect(csp).toContain(directive);
    }
  });

  it("allows unsafe-eval and websockets only in development", () => {
    const dev = buildCsp({ ...base, isDev: true });
    expect(dev).toContain("'unsafe-eval'");
    expect(dev).toContain("ws:");
    expect(buildCsp(base)).not.toContain("ws:");
  });

  it("only upgrades insecure requests when the site is https", () => {
    expect(buildCsp(base)).toContain("upgrade-insecure-requests");
    expect(buildCsp({ ...base, upgradeInsecure: false })).not.toContain("upgrade-insecure-requests");
  });

  it("adds configured origins and drops undefined ones", () => {
    const csp = buildCsp({
      ...base,
      connectOrigins: ["https://s3.example.com", undefined],
      imageOrigins: ["https://cdn.example.com"],
    });
    expect(csp).toContain("connect-src 'self' https://s3.example.com;");
    expect(csp).toContain("img-src 'self' blob: data: https://cdn.example.com;");
  });
});

describe("cspOriginsFromEnv", () => {
  it("reduces URLs to origins and prefers the public storage endpoint", () => {
    const origins = cspOriginsFromEnv({
      STORAGE_ENDPOINT: "http://minio:9000/bucket",
      STORAGE_PUBLIC_ENDPOINT: "https://files.example.com/app",
      NEXT_PUBLIC_SENTRY_DSN: "https://key@o1.ingest.sentry.io/42",
    });
    expect(origins.connectOrigins).toEqual(["https://files.example.com", "https://o1.ingest.sentry.io"]);
  });

  it("ignores invalid URLs", () => {
    expect(cspOriginsFromEnv({ STORAGE_ENDPOINT: "nope" }).connectOrigins).toEqual([undefined, undefined]);
  });
});

describe("staticSecurityHeaders", () => {
  const names = (production: boolean) => staticSecurityHeaders(production).map((header) => header.key);

  it("always sends the baseline headers", () => {
    expect(names(false)).toEqual(
      expect.arrayContaining(["X-Content-Type-Options", "Referrer-Policy", "X-Frame-Options", "Permissions-Policy"]),
    );
  });

  it("sends HSTS only in production", () => {
    expect(names(true)).toContain("Strict-Transport-Security");
    expect(names(false)).not.toContain("Strict-Transport-Security");
  });
});
