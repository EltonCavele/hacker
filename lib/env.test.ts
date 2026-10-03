import { describe, expect, it } from "vitest";
import { EnvError, parseEnv } from "./env";

const SECRET = "x".repeat(32);
const production = {
  NODE_ENV: "production",
  BETTER_AUTH_URL: "https://app.example.com",
  BETTER_AUTH_SECRET: SECRET,
  EMAIL_PROVIDER: "log",
};

describe("parseEnv", () => {
  it("applies defaults and treats empty strings as unset", () => {
    const env = parseEnv({ REDIS_URL: "", EMAIL_PROVIDER: "", GOOGLE_CLIENT_ID: "" });
    expect(env.REDIS_URL).toBe("redis://localhost:6379");
    expect(env.EMAIL_PROVIDER).toBe("resend");
    expect(env.GOOGLE_CLIENT_ID).toBeUndefined();
    expect(env.TRUSTED_PROXY_HOPS).toBe(1);
  });

  it("rejects malformed values", () => {
    expect(() => parseEnv({ BETTER_AUTH_URL: "not a url" })).toThrow(EnvError);
    expect(() => parseEnv({ EMAIL_PROVIDER: "smtp" })).toThrow(EnvError);
  });

  it("requires every variable of a partially configured group", () => {
    expect(() => parseEnv({ VAPID_PUBLIC_KEY: "pub" })).toThrow(/Web Push.*VAPID_SUBJECT, VAPID_PRIVATE_KEY/);
    expect(() => parseEnv({ GOOGLE_CLIENT_ID: "id" })).toThrow(/Google OAuth/);
  });

  it("is lenient outside production so builds do not need secrets", () => {
    expect(() => parseEnv({ NODE_ENV: "production" })).not.toThrow();
  });

  describe("strict (production runtime)", () => {
    it("accepts a complete configuration", () => {
      expect(() => parseEnv(production, { strict: true })).not.toThrow();
    });

    it("requires BETTER_AUTH_URL over https", () => {
      expect(() => parseEnv({ ...production, BETTER_AUTH_URL: undefined }, { strict: true })).toThrow(
        /BETTER_AUTH_URL is required/,
      );
      expect(() => parseEnv({ ...production, BETTER_AUTH_URL: "http://app.example.com" }, { strict: true })).toThrow(
        /https/,
      );
      expect(() =>
        parseEnv({ ...production, BETTER_AUTH_URL: "http://localhost:3000" }, { strict: true }),
      ).not.toThrow();
    });

    it("rejects missing and short secrets", () => {
      expect(() => parseEnv({ ...production, BETTER_AUTH_SECRET: undefined }, { strict: true })).toThrow(
        /BETTER_AUTH_SECRET/,
      );
      expect(() => parseEnv({ ...production, BETTER_AUTH_SECRET: "short" }, { strict: true })).toThrow(/32 characters/);
      // The Dockerfile's build-time placeholder is shorter than 32 characters, so it can never reach production.
      expect(() =>
        parseEnv({ ...production, BETTER_AUTH_SECRET: "docker-image-build-only-secret" }, { strict: true }),
      ).toThrow(/32 characters/);
    });

    it("requires Resend credentials when it is the email provider", () => {
      expect(() => parseEnv({ ...production, EMAIL_PROVIDER: "resend" }, { strict: true })).toThrow(/RESEND_API_KEY/);
    });

    it("requires the Dodo webhook key when the API key is set, and a valid catalog", () => {
      expect(() => parseEnv({ ...production, DODO_PAYMENTS_API_KEY: "k" }, { strict: true })).toThrow(
        /DODO_PAYMENTS_WEBHOOK_KEY/,
      );
      expect(() => parseEnv({ ...production, PAYMENT_CATALOG: "{" }, { strict: true })).toThrow(/PAYMENT_CATALOG/);
    });

    it("reports every problem at once", () => {
      try {
        parseEnv({ NODE_ENV: "production" }, { strict: true });
        expect.unreachable();
      } catch (error) {
        expect((error as EnvError).issues.length).toBeGreaterThan(2);
      }
    });
  });
});
