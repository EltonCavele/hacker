import { isNegativeMark, type PaymentContext, type PaymentResult } from "./types";

/**
 * Decides pay / hold / suspend from the three independent sources.
 * No alert cuts pay on its own. A negative mark only suspends after the worker has been warned.
 */
export function decidePayment(context: PaymentContext): PaymentResult {
  if (context.contestWon) {
    return { decision: "PAY", reason: "contestWon" };
  }
  if (context.employeeStatus === "ADMISSION_PENDING") {
    return { decision: "HOLD", reason: "admissionPending" };
  }
  if (context.highRisk) {
    return { decision: "HOLD", reason: "highRisk" };
  }
  if (context.drawFailed) {
    return { decision: "HOLD", reason: "drawFailed" };
  }
  if (isNegativeMark(context.attestation)) {
    if (context.negativeMarkWarned) return { decision: "SUSPEND", reason: "negativeMarkWarned" };
    return { decision: "HOLD", reason: "negativeMarkAwaitingNotice" };
  }
  if (context.employeeStatus === "IN_TRANSIT") {
    const days = context.transitDays ?? 0;
    if (days < 60) return { decision: "PAY", reason: "inTransit" };
    return { decision: "HOLD", reason: "transitExpired" };
  }
  if (!context.chiefCompletedRoster) {
    return { decision: "PAY", reason: "chiefDidNotAttest" };
  }
  if (context.mediumRisk) {
    return { decision: "PAY", reason: "mediumRiskQueued" };
  }
  return { decision: "PAY", reason: "clean" };
}
