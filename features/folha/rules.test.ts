import { describe, expect, it } from "vitest";
import { detectAnomalies } from "./anomalies";
import { createRng, pickMonthlyDraw } from "./draw";
import { decidePayment } from "./payment";
import type { FolhaEmployeeSnapshot, FolhaUnitSnapshot, PaymentContext } from "./types";

const now = new Date("2026-10-03T00:00:00Z");

function employee(overrides: Partial<FolhaEmployeeSnapshot> = {}): FolhaEmployeeSnapshot {
  return {
    id: "e1",
    name: "Ana Silva",
    nuit: "1001",
    identityCard: "BI-1",
    bornAt: new Date("1990-01-01"),
    faceToken: "face-ana",
    accountNumber: "MZ-1",
    accountHolder: "Ana Silva",
    salaryMzn: 8758,
    status: "ACTIVE",
    receivesPension: false,
    operatorId: "rh-1",
    createdWithoutProcess: false,
    unitId: "u1",
    ...overrides,
  };
}

function cleanPay(overrides: Partial<PaymentContext> = {}): PaymentContext {
  return {
    employeeStatus: "ACTIVE",
    attestation: "PRESENT",
    chiefCompletedRoster: true,
    highRisk: false,
    mediumRisk: false,
    transitDays: null,
    negativeMarkWarned: false,
    contestWon: false,
    drawFailed: false,
    ...overrides,
  };
}

describe("decidePayment", () => {
  it("pays a clean attested record", () => {
    expect(decidePayment(cleanPay())).toEqual({ decision: "PAY", reason: "clean" });
  });

  it("pays the team when the chief did not attest", () => {
    expect(decidePayment(cleanPay({ attestation: null, chiefCompletedRoster: false }))).toEqual({
      decision: "PAY",
      reason: "chiefDidNotAttest",
    });
  });

  it("holds a negative mark until the worker is warned", () => {
    expect(decidePayment(cleanPay({ attestation: "LEFT" }))).toEqual({
      decision: "HOLD",
      reason: "negativeMarkAwaitingNotice",
    });
  });

  it("suspends after a warned negative mark", () => {
    expect(decidePayment(cleanPay({ attestation: "DECEASED", negativeMarkWarned: true }))).toEqual({
      decision: "SUSPEND",
      reason: "negativeMarkWarned",
    });
    expect(decidePayment(cleanPay({ attestation: "UNKNOWN", negativeMarkWarned: true })).decision).toBe("SUSPEND");
  });

  it("holds high-risk alerts instead of cutting pay", () => {
    expect(decidePayment(cleanPay({ highRisk: true }))).toEqual({ decision: "HOLD", reason: "highRisk" });
  });

  it("pays medium-risk alerts and leaves them queued", () => {
    expect(decidePayment(cleanPay({ mediumRisk: true }))).toEqual({ decision: "PAY", reason: "mediumRiskQueued" });
  });

  it("pays transfers in transit for under 60 days", () => {
    expect(decidePayment(cleanPay({ employeeStatus: "IN_TRANSIT", transitDays: 12 }))).toEqual({
      decision: "PAY",
      reason: "inTransit",
    });
  });

  it("holds transfers still in transit after 60 days", () => {
    expect(decidePayment(cleanPay({ employeeStatus: "IN_TRANSIT", transitDays: 61 }))).toEqual({
      decision: "HOLD",
      reason: "transitExpired",
    });
  });

  it("pays a successful contest with back pay", () => {
    expect(decidePayment(cleanPay({ attestation: "LEFT", negativeMarkWarned: true, contestWon: true }))).toEqual({
      decision: "PAY",
      reason: "contestWon",
    });
  });

  it("holds an admission that is still pending", () => {
    expect(decidePayment(cleanPay({ employeeStatus: "ADMISSION_PENDING" }))).toEqual({
      decision: "HOLD",
      reason: "admissionPending",
    });
  });

  it("holds a failed workplace photo draw", () => {
    expect(decidePayment(cleanPay({ drawFailed: true }))).toEqual({ decision: "HOLD", reason: "drawFailed" });
  });
});

describe("detectAnomalies", () => {
  const unit: FolhaUnitSnapshot = { id: "u1", name: "Escola", chiefEmployeeId: "chief", staffCount: 2, admissionCount: 1 };

  it("flags several salaries on the same account", () => {
    const alerts = detectAnomalies(
      [employee({ id: "a", accountNumber: "X" }), employee({ id: "b", name: "B", accountHolder: "B", nuit: "2", identityCard: "2", faceToken: "f2", accountNumber: "X" })],
      [unit],
      now,
    );
    expect(alerts.some((alert) => alert.type === "SHARED_ACCOUNT" && alert.risk === "HIGH")).toBe(true);
  });

  it("flags an account that is not in the worker's name", () => {
    const alerts = detectAnomalies([employee({ accountHolder: "Familiar" })], [unit], now);
    expect(alerts.some((alert) => alert.type === "ACCOUNT_HOLDER_MISMATCH")).toBe(true);
  });

  it("flags the same face on two records", () => {
    const alerts = detectAnomalies(
      [employee({ id: "a" }), employee({ id: "b", name: "B", accountHolder: "B", nuit: "2", identityCard: "2", accountNumber: "MZ-2", faceToken: "face-ana" })],
      [unit],
      now,
    );
    expect(alerts.some((alert) => alert.type === "DUPLICATE_FACE")).toBe(true);
  });

  it("flags a duplicated NUIT", () => {
    const alerts = detectAnomalies(
      [employee({ id: "a" }), employee({ id: "b", name: "B", accountHolder: "B", identityCard: "2", faceToken: "f2", accountNumber: "MZ-2" })],
      [unit],
      now,
    );
    expect(alerts.some((alert) => alert.type === "DUPLICATE_NUIT")).toBe(true);
  });

  it("flags salary and pension together", () => {
    const alerts = detectAnomalies([employee({ receivesPension: true })], [unit], now);
    expect(alerts.some((alert) => alert.type === "SALARY_AND_PENSION" && alert.risk === "HIGH")).toBe(true);
  });

  it("flags staff above retirement age as medium risk", () => {
    const alerts = detectAnomalies([employee({ bornAt: new Date("1960-01-01") })], [unit], now);
    expect(alerts.some((alert) => alert.type === "OVER_RETIREMENT_AGE" && alert.risk === "MEDIUM")).toBe(true);
  });

  it("flags a worker without a unit", () => {
    const alerts = detectAnomalies([employee({ unitId: null, status: "NO_UNIT" })], [unit], now);
    expect(alerts.some((alert) => alert.type === "NO_UNIT")).toBe(true);
  });

  it("flags a unit that grew without admissions", () => {
    const alerts = detectAnomalies(
      [employee(), employee({ id: "b", name: "B", accountHolder: "B", nuit: "2", identityCard: "2", faceToken: "f2", accountNumber: "MZ-2" })],
      [{ id: "u1", name: "Escola", chiefEmployeeId: "chief", staffCount: 5, admissionCount: 0 }],
      now,
    );
    expect(alerts.some((alert) => alert.type === "GROWTH_WITHOUT_ADMISSION")).toBe(true);
  });
});

describe("pickMonthlyDraw", () => {
  it("includes people who have not been drawn this year", () => {
    const ids = ["a", "b", "c"];
    const picked = pickMonthlyDraw({
      employeeIds: ids,
      drawnThisYear: { a: [1], b: [2] },
      month: 10,
      random: createRng(3),
      extraPerUnit: 0,
    });
    expect(picked).toContain("c");
  });

  it("does not let the chief predict a fixed list: extra draws change with the seed", () => {
    const ids = ["a", "b", "c", "d", "e", "f"];
    const first = pickMonthlyDraw({ employeeIds: ids, drawnThisYear: { a: [1], b: [2], c: [3], d: [4], e: [5], f: [6] }, month: 10, random: createRng(1), extraPerUnit: 2 });
    const second = pickMonthlyDraw({ employeeIds: ids, drawnThisYear: { a: [1], b: [2], c: [3], d: [4], e: [5], f: [6] }, month: 10, random: createRng(99), extraPerUnit: 2 });
    expect(first.join()).not.toBe(second.join());
  });
});
