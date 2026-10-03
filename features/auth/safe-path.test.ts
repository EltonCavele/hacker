import { describe, expect, it } from "vitest";
import { safeAppPath } from "./safe-path";

describe("safeAppPath", () => {
  it("keeps an internal folha path, including the query", () => {
    expect(safeAppPath("/folha/auditor/aaaaaaaa-bbbb-4ccc-8ddd-000000000101")).toBe(
      "/folha/auditor/aaaaaaaa-bbbb-4ccc-8ddd-000000000101",
    );
    expect(safeAppPath("/folha/funcionario?id=ana")).toBe("/folha/funcionario?id=ana");
  });

  it("falls back for missing, off-site and protocol-relative values", () => {
    expect(safeAppPath(undefined)).toBe("/dashboard");
    expect(safeAppPath("")).toBe("/dashboard");
    expect(safeAppPath("https://evil.example")).toBe("/dashboard");
    expect(safeAppPath("//evil.example")).toBe("/dashboard");
    expect(safeAppPath("/\\evil.example")).toBe("/dashboard");
    expect(safeAppPath("/%2f%2fevil.example", "/folha")).toBe("/folha");
    expect(safeAppPath("/login")).toBe("/dashboard");
    expect(safeAppPath("/api/payments/checkout")).toBe("/dashboard");
  });
});
