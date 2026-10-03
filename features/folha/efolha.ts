import type { PrismaClient } from "@/generated/prisma/client";
import type { PaymentDecision } from "./types";
import { decideRow, twoSourcesConfirmed } from "./run";

/** A line reaches CEDSIF only after the e-folha sheet has been validated and the decision is to pay. */
export function releasesToCedsif(decision: PaymentDecision) {
  return decision === "PAY";
}

async function loadPayroll(prisma: PrismaClient, cycleId: string) {
  const [employees, cycleAttestations, anomalies, draws, contests, units] = await Promise.all([
    prisma.folhaEmployee.findMany({ include: { unit: true }, orderBy: { name: "asc" } }),
    prisma.folhaAttestation.findMany({ where: { cycleId } }),
    prisma.folhaAnomaly.findMany({ where: { cycleId } }),
    prisma.folhaDraw.findMany({ where: { cycleId } }),
    prisma.folhaContest.findMany({ where: { cycleId } }),
    prisma.folhaUnit.findMany({ include: { _count: { select: { employees: true } } } }),
  ]);
  const attestByEmployee = new Map(cycleAttestations.map((row) => [row.employeeId, row]));
  const drawByEmployee = new Map(draws.map((row) => [row.employeeId, row]));
  const contestByEmployee = new Map(contests.map((row) => [row.employeeId, row]));
  const unitCounts = new Map(units.map((unit) => [unit.id, { staff: unit._count.employees, attested: 0 }]));
  for (const row of cycleAttestations) {
    const unit = unitCounts.get(row.unitId);
    if (unit) unit.attested += 1;
  }

  return employees.map((employee) => {
    const attestation = attestByEmployee.get(employee.id) ?? null;
    const draw = drawByEmployee.get(employee.id) ?? null;
    const contest = contestByEmployee.get(employee.id) ?? null;
    const ownAnomalies = anomalies.filter((alert) => alert.employeeId === employee.id || alert.unitId === employee.unitId);
    const counts = employee.unitId ? unitCounts.get(employee.unitId) : undefined;
    const payment = decideRow({
      status: employee.status,
      transitStartedAt: employee.transitStartedAt,
      attestation: attestation ? { mark: attestation.mark, warnedAt: attestation.warnedAt } : null,
      unitEmployeeCount: counts?.staff ?? 0,
      unitAttestationCount: counts?.attested ?? 0,
      highRisk: ownAnomalies.some((alert) => alert.risk === "HIGH"),
      mediumRisk: ownAnomalies.some((alert) => alert.risk === "MEDIUM"),
      contestWon: contest?.status === "VERIFIED_GENUINE",
      drawFailed: draw?.photoResult === "NO_SHOW" || draw?.photoResult === "LOCATION_FAIL" || draw?.photoResult === "NOT_A_LIVE_FACE",
    });
    return {
      employee,
      attestation,
      payment,
      verified: twoSourcesConfirmed({
        attestation,
        drawResult: draw?.photoResult ?? null,
        auditFound: null,
        highRisk: ownAnomalies.some((alert) => alert.risk === "HIGH"),
      }),
    };
  });
}

/**
 * Automatic gate: the sheet has arrived from e-folha, so validate every line
 * before CEDSIF is allowed to pay it.
 */
export async function validateEfolhaSheet(prisma: PrismaClient, cycleId: string) {
  const payroll = await loadPayroll(prisma, cycleId);
  const lines = payroll.map((row) => ({
    employeeId: row.employee.id,
    decision: row.payment.decision as PaymentDecision,
    reason: row.payment.reason,
    amountMzn: row.employee.salaryMzn,
    released: releasesToCedsif(row.payment.decision),
  }));
  const releasedCount = lines.filter((line) => line.released).length;
  const existing = await prisma.folhaPayrollBatch.findUnique({ where: { cycleId } });
  const now = new Date();
  const batch = await prisma.folhaPayrollBatch.upsert({
    where: { cycleId },
    create: {
      cycleId,
      source: "e-folha",
      receivedAt: now,
      validatedAt: now,
      lineCount: lines.length,
      releasedCount,
      heldCount: lines.length - releasedCount,
    },
    update: {
      validatedAt: now,
      lineCount: lines.length,
      releasedCount,
      heldCount: lines.length - releasedCount,
    },
  });
  await prisma.folhaPaymentLine.deleteMany({ where: { batchId: batch.id } });
  if (lines.length > 0) {
    await prisma.folhaPaymentLine.createMany({
      data: lines.map((line) => ({ ...line, batchId: batch.id })),
    });
  }
  return {
    ...batch,
    receivedAt: existing?.receivedAt ?? batch.receivedAt,
    lines,
  };
}
