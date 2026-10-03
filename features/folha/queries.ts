import "server-only";

import { prisma } from "@/lib/db/client";
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

export async function getPublicPanel() {
  const cycle = await getActiveCycle();
  if (!cycle) {
    return { cycle: null, districts: [] as Array<ReturnType<typeof districtMetrics>> };
  }
  const [payroll, audits, units, contests] = await Promise.all([
    getPayroll(cycle.id),
    prisma.folhaAudit.findMany({ where: { cycleId: cycle.id } }),
    prisma.folhaUnit.findMany(),
    prisma.folhaContest.findMany({ where: { cycleId: cycle.id } }),
  ]);
  const districts = [...new Set(units.map((unit) => unit.district))].sort();
  return {
    cycle,
    districts: districts.map((district) =>
      districtMetrics(
        district,
        units.filter((unit) => unit.district === district),
        payroll.filter((row) => row.employee.unit?.district === district || (!row.employee.unit && district === "Marracuene")),
        audits.filter((audit) => units.find((unit) => unit.id === audit.unitId)?.district === district),
        contests.filter((contest) => payroll.find((row) => row.employee.id === contest.employeeId)?.employee.unit?.district === district),
      ),
    ),
  };
}

function districtMetrics(
  district: string,
  units: Array<{ id: string; chiefEmployeeId: string | null; _count?: { employees: number } }>,
  payroll: Awaited<ReturnType<typeof getPayroll>>,
  audits: Array<{ attestedAs: string | null; foundPresent: boolean }>,
  contests: Array<{ status: string; createdAt: Date; reactivatedAt: Date | null }>,
) {
  const withOwner = payroll.filter((row) => row.employee.unitId && units.find((unit) => unit.id === row.employee.unitId)?.chiefEmployeeId);
  const verified = payroll.filter((row) => row.verified);
  const unitIds = new Set(units.map((unit) => unit.id));
  const unitsAttested = units.filter((unit) => payroll.some((row) => row.employee.unitId === unit.id && row.attestation)).length;
  const discrepancies = audits.filter((audit) => audit.attestedAs === "PRESENT" && !audit.foundPresent).length;
  const suspended = payroll.filter((row) => row.payment.decision === "SUSPEND");
  const genuine = contests.filter((contest) => contest.status === "VERIFIED_GENUINE").length;
  const reactivated = contests.filter((contest) => contest.reactivatedAt);
  const medianDays =
    reactivated.length === 0
      ? null
      : median(reactivated.map((contest) => Math.round((contest.reactivatedAt!.getTime() - contest.createdAt.getTime()) / 86_400_000)));
  return {
    district,
    owned: payroll.length === 0 ? 0 : Math.round((withOwner.length / payroll.length) * 100),
    verified: payroll.length === 0 ? 0 : Math.round((verified.length / payroll.length) * 100),
    attestedOnTime: units.length === 0 ? 0 : Math.round((unitsAttested / units.length) * 100),
    discrepancies,
    exclusion: suspended.length === 0 ? 0 : Math.round((genuine / Math.max(suspended.length, 1)) * 100),
    reactivationDays: medianDays,
    unitCount: units.length,
    staff: payroll.length,
    unitIds: [...unitIds],
  };
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
}
