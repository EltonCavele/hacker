import { afterEach, describe, expect, it, vi } from "vitest";
import { localeFromAcceptLanguage, localeFromCountry, detectLocale } from "./detect";
import { locales } from "./config";
import en from "../../messages/en.json";
import pt from "../../messages/pt.json";

function keys(value: unknown, prefix = ""): string[] {
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    typeof child === "object" && child !== null ? keys(child, `${prefix}${key}.`) : [`${prefix}${key}`],
  );
}

describe("messages", () => {
  it("define the same keys in every locale", () => {
    expect(keys(pt).sort()).toEqual(keys(en).sort());
    expect(locales).toEqual(["pt", "en"]);
  });
});

describe("localeFromCountry", () => {
  it.each(["PT", "br", "AO", "MZ", "CV", "GW", "ST", "TL"])("%s -> pt", (country) => {
    expect(localeFromCountry(country)).toBe("pt");
  });
  it.each(["US", "FR", "ZA", "", null, undefined])("%s -> en", (country) => {
    expect(localeFromCountry(country)).toBe("en");
  });
});

describe("localeFromAcceptLanguage", () => {
  it("uses the first listed language", () => {
    expect(localeFromAcceptLanguage("pt-BR,en;q=0.8")).toBe("pt");
    expect(localeFromAcceptLanguage("en-US,pt;q=0.8")).toBe("en");
    expect(localeFromAcceptLanguage(null)).toBe("en");
  });
});

describe("detectLocale", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("trusts the CDN country header without any lookup", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await detectLocale(new Headers({ "cf-ipcountry": "PT" }), "8.8.8.8")).toEqual({
      locale: "pt",
      confident: true,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("looks the IP up once and memoises the answer", async () => {
    const fetchMock = vi.fn(async () => new Response("MZ"));
    vi.stubGlobal("fetch", fetchMock);
    const first = await detectLocale(new Headers(), "41.220.1.1");
    const second = await detectLocale(new Headers(), "41.220.1.1");
    expect(first).toEqual({ locale: "pt", confident: true });
    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to Accept-Language, unconfidently, when the lookup fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("timeout");
      }),
    );
    expect(await detectLocale(new Headers({ "accept-language": "pt-PT" }), "41.220.2.2")).toEqual({
      locale: "pt",
      confident: false,
    });
  });

  it("never sends private or unknown addresses to the lookup service", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await detectLocale(new Headers(), "192.168.1.5")).toEqual({ locale: "en", confident: false });
    expect(await detectLocale(new Headers(), "unknown")).toEqual({ locale: "en", confident: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
