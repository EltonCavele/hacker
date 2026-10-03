import "server-only";

import { prisma } from "@/lib/db/client";
import { validateEfolhaSheet } from "./efolha";
import { buildPanelStats, emptyPanelStats } from "./panel";
import { decideRow, twoSourcesConfirmed } from "./run";

export async function getActiveCycle() {
  return prisma.folhaCycle.findFirst({ orderBy: { yearMonth: "desc" } });
}

export async function getUnits() {
  return prisma.folhaUnit.findMany({
    include: { chief: true, deputy: true, parent: true, _count: { select: { employees: true } } },
    orderBy: [{ province: "asc" }, { district: "asc" }, { name: "asc" }],
  });
}

export async function getPayroll(cycleId: string) {
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
      draw,
      contest,
      anomalies: ownAnomalies,
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

export async function getUnitRoster(cycleId: string, unitId: string) {
  const [unit, employees, attestations, draws, anomalies] = await Promise.all([
    prisma.folhaUnit.findUnique({ where: { id: unitId }, include: { chief: true, deputy: true, parent: true } }),
    prisma.folhaEmployee.findMany({ where: { unitId }, orderBy: { name: "asc" } }),
    prisma.folhaAttestation.findMany({ where: { cycleId, unitId } }),
    prisma.folhaDraw.findMany({ where: { cycleId, unitId }, include: { employee: true } }),
    prisma.folhaAnomaly.findMany({ where: { cycleId, unitId } }),
  ]);
  const attestByEmployee = new Map(attestations.map((row) => [row.employeeId, row]));
  return { unit, employees, attestations: attestByEmployee, draws, anomalies };
}

export async function getAuditQueue(cycleId: string) {
  const [units, anomalies, audits, attestations] = await Promise.all([
    prisma.folhaUnit.findMany({ include: { employees: true, chief: true }, orderBy: { name: "asc" } }),
    prisma.folhaAnomaly.findMany({ where: { cycleId, risk: "HIGH" } }),
    prisma.folhaAudit.findMany({ where: { cycleId }, include: { employee: true, unit: true } }),
    prisma.folhaAttestation.findMany({ where: { cycleId } }),
  ]);
  const riskyUnitIds = new Set(anomalies.map((alert) => alert.unitId).filter((id): id is string => Boolean(id)));
  const attestByEmployee = new Map(attestations.map((row) => [row.employeeId, row]));
  return { units, riskyUnitIds, audits, attestByEmployee };
}

export async function getEmployeeDesk(cycleId: string, employeeId?: string) {
  const employees = await prisma.folhaEmployee.findMany({ include: { unit: true }, orderBy: { name: "asc" } });
  const current = employees.find((employee) => employee.id === employeeId) ?? employees.find((employee) => employee.name === "Ana Contestação") ?? employees[0];
  if (!current) return { employees, current: null, attestation: null, contest: null, payment: null, anomalies: [] };
  const [attestation, contest, anomalies, draws, unitCount] = await Promise.all([
    prisma.folhaAttestation.findUnique({ where: { cycleId_employeeId: { cycleId, employeeId: current.id } } }),
    prisma.folhaContest.findFirst({ where: { cycleId, employeeId: current.id }, orderBy: { createdAt: "desc" } }),
    prisma.folhaAnomaly.findMany({ where: { cycleId, employeeId: current.id } }),
    prisma.folhaDraw.findUnique({ where: { cycleId_employeeId: { cycleId, employeeId: current.id } } }),
    current.unitId
      ? prisma.folhaAttestation.count({ where: { cycleId, unitId: current.unitId } }).then(async (attested) => ({
          staff: await prisma.folhaEmployee.count({ where: { unitId: current.unitId } }),
          attested,
        }))
      : { staff: 0, attested: 0 },
  ]);
  const payment = decideRow({
    status: current.status,
    transitStartedAt: current.transitStartedAt,
    attestation: attestation ? { mark: attestation.mark, warnedAt: attestation.warnedAt } : null,
    unitEmployeeCount: unitCount.staff,
    unitAttestationCount: unitCount.attested,
    highRisk: anomalies.some((alert) => alert.risk === "HIGH"),
    mediumRisk: anomalies.some((alert) => alert.risk === "MEDIUM"),
    contestWon: contest?.status === "VERIFIED_GENUINE",
    drawFailed: draws?.photoResult === "NO_SHOW" || draws?.photoResult === "LOCATION_FAIL" || draws?.photoResult === "NOT_A_LIVE_FACE",
  });
  return { employees, current, attestation, contest, payment, anomalies };
}

export async function getCedsifDesk(cycleId: string) {
  const [payroll, movements, cases, units] = await Promise.all([
    getPayroll(cycleId),
    prisma.folhaMovement.findMany({ include: { employee: true, fromUnit: true, toUnit: true }, orderBy: { occurredAt: "desc" } }),
    prisma.folhaCase.findMany({ include: { employee: true }, orderBy: { createdAt: "desc" } }),
    getUnits(),
  ]);
  const unclaimed = payroll.filter((row) => {
    const since = row.employee.unclaimedSince;
    if (!since) return row.employee.status === "NO_UNIT";
    return Date.now() - since.getTime() > 60 * 86_400_000;
  });
  const anomalies = payroll.flatMap((row) => row.anomalies.map((alert) => ({ ...alert, employee: row.employee })));
  return { payroll, movements, cases, units, unclaimed, anomalies };
}

export async function getCedsifGate() {
  const cycle = await getActiveCycle();
  if (!cycle) return null;
  const [gate, desk] = await Promise.all([validateEfolhaSheet(prisma, cycle.id), getCedsifDesk(cycle.id)]);
  return { cycle, gate, desk };
}

export async function getPublicPanel() {
  const cycle = await getActiveCycle();
  if (!cycle) {
    return { cycle: null, stats: emptyPanelStats() };
  }
  const [payroll, audits, units, anomalies] = await Promise.all([
    getPayroll(cycle.id),
    prisma.folhaAudit.findMany({ where: { cycleId: cycle.id } }),
    prisma.folhaUnit.findMany(),
    prisma.folhaAnomaly.findMany({
      where: { cycleId: cycle.id },
      include: {
        unit: { select: { district: true } },
        employee: { select: { unit: { select: { district: true } } } },
      },
    }),
  ]);
  const districtByUnit = new Map(units.map((unit) => [unit.id, unit.district]));
  return {
    cycle,
    stats: buildPanelStats({
      units: units.map((unit) => ({
        id: unit.id,
        name: unit.name,
        district: unit.district,
        province: unit.province,
        sector: unit.sector,
        chiefEmployeeId: unit.chiefEmployeeId,
      })),
      payroll: payroll.map((row) => ({
        unitId: row.employee.unitId,
        district: row.employee.unit?.district ?? null,
        salaryMzn: row.employee.salaryMzn,
        verified: row.verified,
        attested: Boolean(row.attestation),
        decision: row.payment.decision,
      })),
      audits: audits.map((audit) => ({
        unitId: audit.unitId,
        district: districtByUnit.get(audit.unitId) ?? null,
        discrepancy: audit.attestedAs === "PRESENT" && !audit.foundPresent,
      })),
      anomalies: anomalies.map((alert) => ({
        unitId: alert.unitId,
        district: alert.unit?.district ?? alert.employee?.unit?.district ?? null,
        risk: alert.risk,
      })),
    }),
  };
}
