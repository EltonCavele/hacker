import { decidePayment } from "./payment";
import { isNegativeMark, type PaymentContext, type PaymentResult } from "./types";

export type PayrollRowInput = {
  status: string;
  transitStartedAt: Date | null;
  attestation: { mark: string; warnedAt: Date | null } | null;
  unitEmployeeCount: number;
  unitAttestationCount: number;
  highRisk: boolean;
  mediumRisk: boolean;
  contestWon: boolean;
  drawFailed: boolean;
  now?: Date;
};

export function transitDays(startedAt: Date | null, now: Date) {
  if (!startedAt) return null;
  return Math.floor((now.getTime() - startedAt.getTime()) / 86_400_000);
}

export function paymentContextFromRow(row: PayrollRowInput): PaymentContext {
  const now = row.now ?? new Date();
  return {
    employeeStatus: row.status,
    attestation: row.attestation?.mark ?? null,
    chiefCompletedRoster: row.unitEmployeeCount > 0 && row.unitAttestationCount >= row.unitEmployeeCount,
    highRisk: row.highRisk,
    mediumRisk: row.mediumRisk,
    transitDays: transitDays(row.transitStartedAt, now),
    negativeMarkWarned: Boolean(row.attestation && isNegativeMark(row.attestation.mark) && row.attestation.warnedAt),
    contestWon: row.contestWon,
    drawFailed: row.drawFailed,
  };
}

export function decideRow(row: PayrollRowInput): PaymentResult {
  return decidePayment(paymentContextFromRow(row));
}

export function twoSourcesConfirmed(row: {
  attestation: { mark: string } | null;
  drawResult: string | null;
  auditFound: boolean | null;
  highRisk: boolean;
}) {
  const attested = row.attestation !== null;
  const second =
    row.drawResult === "MATCH" || row.auditFound === true || (attested && !row.highRisk && row.drawResult !== "NO_SHOW" && row.drawResult !== "LOCATION_FAIL");
  return attested && second;
}
