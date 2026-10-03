import { detectAnomalies } from "../features/folha/anomalies";
import { pickMonthlyDraw } from "../features/folha/draw";
import type { PrismaClient } from "../generated/prisma/client";

function id(n: number) {
  return `aaaaaaaa-bbbb-4ccc-8ddd-${n.toString().padStart(12, "0")}`;
}

function daysAgo(days: number) {
  return new Date(Date.UTC(2026, 9, 3) - days * 86_400_000);
}

export const FOLHA_IDS = {
  cycle: id(1),
  units: {
    marracueneEdu: id(101),
    escolaMarracuene: id(102),
    saudeMarracuene: id(103),
    chiureEdu: id(104),
    escolaChiure: id(105),
    postoChiure: id(106),
    esquadra: id(107),
    nacional: id(108),
    semChefe: id(109),
  },
  people: {
    chefeEscolaM: id(201),
    chefeSaudeM: id(202),
    chefeEscolaC: id(203),
    chefePostoC: id(204),
    chefeEsquadra: id(205),
    chefeNacional: id(206),
    chefeMarracueneEdu: id(207),
    chefeChiureEdu: id(208),
    ana: id(301),
    joaoFalecido: id(302),
    mariaEmigrou: id(303),
    pedro: id(304),
    lucia: id(305),
    tomasDeslocado: id(306),
    beatriz: id(307),
    carlos: id(308),
    enfermeiraTransito: id(309),
    enfermeiro: id(310),
    enfermeiraChiure: id(311),
    policia: id(312),
    reformado: id(313),
    pensao: id(314),
    ficticio: id(315),
    cloneRosto: id(316),
    semUnidade: id(317),
    contaPartilhadaA: id(318),
    contaPartilhadaB: id(319),
    fantasma1: id(320),
    fantasma2: id(321),
    fantasma3: id(322),
    fantasma4: id(323),
    admissaoPendente: id(324),
  },
};

export async function seedFolha(prisma: PrismaClient) {
  await prisma.folhaCase.deleteMany();
  await prisma.folhaContest.deleteMany();
  await prisma.folhaMovement.deleteMany();
  await prisma.folhaAudit.deleteMany();
  await prisma.folhaDraw.deleteMany();
  await prisma.folhaAnomaly.deleteMany();
  await prisma.folhaAttestation.deleteMany();
  await prisma.folhaEmployee.deleteMany();
  await prisma.folhaUnit.deleteMany();
  await prisma.folhaCycle.deleteMany();

  const cycle = await prisma.folhaCycle.create({
    data: {
      id: FOLHA_IDS.cycle,
      yearMonth: "2026-10",
      opensAt: new Date("2026-10-01T00:00:00Z"),
      closesAt: new Date("2026-10-10T23:59:59Z"),
    },
  });

  const U = FOLHA_IDS.units;
  const P = FOLHA_IDS.people;

  await prisma.folhaUnit.createMany({
    data: [
      { id: U.marracueneEdu, name: "SDEJT Marracuene", type: "direcção distrital", sector: "EDUCATION", district: "Marracuene", province: "Maputo", ugb: "UGB-MAP-EDU-01" },
      { id: U.escolaMarracuene, name: "Escola Primária Completa Marracuene", type: "escola", sector: "EDUCATION", district: "Marracuene", province: "Maputo", ugb: "UGB-MAP-EDU-01", parentId: U.marracueneEdu },
      { id: U.saudeMarracuene, name: "Centro de Saúde Marracuene", type: "unidade sanitária", sector: "HEALTH", district: "Marracuene", province: "Maputo", ugb: "UGB-MAP-SAU-01" },
      { id: U.chiureEdu, name: "SDEJT Chiúre", type: "direcção distrital", sector: "EDUCATION", district: "Chiúre", province: "Cabo Delgado", ugb: "UGB-CD-EDU-04", conflictZone: true },
      { id: U.escolaChiure, name: "Escola Completa de Chiúre", type: "escola", sector: "EDUCATION", district: "Chiúre", province: "Cabo Delgado", ugb: "UGB-CD-EDU-04", parentId: U.chiureEdu, offlineZone: true, conflictZone: true },
      { id: U.postoChiure, name: "Posto de Saúde de Chiúre", type: "posto de saúde", sector: "HEALTH", district: "Chiúre", province: "Cabo Delgado", ugb: "UGB-CD-SAU-04", offlineZone: true, conflictZone: true },
      { id: U.esquadra, name: "Esquadra de Marracuene", type: "esquadra", sector: "POLICE", district: "Marracuene", province: "Maputo", ugb: "UGB-MAP-INT-01" },
      { id: U.nacional, name: "Direcção Nacional de Recursos Humanos", type: "direcção", sector: "CENTRAL", district: "KaMpfumo", province: "Maputo", ugb: "UGB-MAEFP-01" },
      { id: U.semChefe, name: "Repartição sem chefe nomeado", type: "repartição", sector: "DISTRICT_ADMIN", district: "Marracuene", province: "Maputo", ugb: "UGB-MAP-ADM-09" },
    ],
  });

  await prisma.folhaEmployee.createMany({
    data: [
      { id: P.chefeEscolaM, name: "Ilda Muianga", nuit: "400000001", identityCard: "110100001", bornAt: new Date("1982-03-12"), faceToken: "face-ilda", accountNumber: "BIM-001", accountHolder: "Ilda Muianga", salaryMzn: 18500, operatorId: "rh-marracuene", unitId: U.escolaMarracuene },
      { id: P.chefeSaudeM, name: "Hélder Banze", nuit: "400000002", identityCard: "110100002", bornAt: new Date("1979-07-01"), faceToken: "face-helder", accountNumber: "BIM-002", accountHolder: "Hélder Banze", salaryMzn: 21000, operatorId: "rh-marracuene", unitId: U.saudeMarracuene },
      { id: P.chefeEscolaC, name: "Amélia Namuoro", nuit: "400000003", identityCard: "110100003", bornAt: new Date("1985-11-20"), faceToken: "face-amelia", accountNumber: "BCI-003", accountHolder: "Amélia Namuoro", salaryMzn: 17200, operatorId: "rh-chiure", unitId: U.escolaChiure },
      { id: P.chefePostoC, name: "Sérgio Anli", nuit: "400000004", identityCard: "110100004", bornAt: new Date("1988-02-02"), faceToken: "face-sergio", accountNumber: "BCI-004", accountHolder: "Sérgio Anli", salaryMzn: 16800, operatorId: "rh-chiure", unitId: U.postoChiure },
      { id: P.chefeEsquadra, name: "Comandante Rui Langa", nuit: "400000005", identityCard: "110100005", bornAt: new Date("1975-05-05"), faceToken: "face-rui", accountNumber: "MCB-005", accountHolder: "Comandante Rui Langa", salaryMzn: 24000, operatorId: "rh-pr", unitId: U.esquadra },
      { id: P.chefeNacional, name: "Teresa Macamo", nuit: "400000006", identityCard: "110100006", bornAt: new Date("1972-09-09"), faceToken: "face-teresa", accountNumber: "BIM-006", accountHolder: "Teresa Macamo", salaryMzn: 32000, operatorId: "rh-maefp", unitId: U.nacional },
      { id: P.chefeMarracueneEdu, name: "Arnaldo Cossa", nuit: "400000007", identityCard: "110100007", bornAt: new Date("1970-04-18"), faceToken: "face-arnaldo", accountNumber: "BIM-007", accountHolder: "Arnaldo Cossa", salaryMzn: 28000, operatorId: "rh-marracuene", unitId: U.marracueneEdu },
      { id: P.chefeChiureEdu, name: "Fátima Ali", nuit: "400000008", identityCard: "110100008", bornAt: new Date("1981-12-12"), faceToken: "face-fatima", accountNumber: "BCI-008", accountHolder: "Fátima Ali", salaryMzn: 25000, operatorId: "rh-chiure", unitId: U.chiureEdu },
      { id: P.ana, name: "Ana Contestação", nuit: "500000001", identityCard: "110200001", bornAt: new Date("1994-06-15"), faceToken: "face-ana", accountNumber: "BIM-101", accountHolder: "Ana Contestação", salaryMzn: 8758, operatorId: "rh-marracuene", unitId: U.escolaMarracuene },
      { id: P.joaoFalecido, name: "João Faleceu", nuit: "500000002", identityCard: "110200002", bornAt: new Date("1968-01-30"), faceToken: "face-joao", accountNumber: "BIM-102", accountHolder: "João Faleceu", salaryMzn: 8758, operatorId: "rh-marracuene", unitId: U.escolaMarracuene },
      { id: P.mariaEmigrou, name: "Maria Emigrou", nuit: "500000003", identityCard: "110200003", bornAt: new Date("1991-08-08"), faceToken: "face-maria", accountNumber: "BIM-103", accountHolder: "Maria Emigrou", salaryMzn: 8758, operatorId: "rh-marracuene", unitId: U.escolaMarracuene },
      { id: P.pedro, name: "Pedro Presente", nuit: "500000004", identityCard: "110200004", bornAt: new Date("1996-03-03"), faceToken: "face-pedro", accountNumber: "BIM-104", accountHolder: "Pedro Presente", salaryMzn: 8758, operatorId: "rh-marracuene", unitId: U.escolaMarracuene },
      { id: P.lucia, name: "Lúcia Presente", nuit: "500000005", identityCard: "110200005", bornAt: new Date("1998-10-10"), faceToken: "face-lucia", accountNumber: "BIM-105", accountHolder: "Lúcia Presente", salaryMzn: 8758, operatorId: "rh-marracuene", unitId: U.escolaMarracuene },
      { id: P.tomasDeslocado, name: "Tomás Deslocado", nuit: "500000006", identityCard: "110200006", bornAt: new Date("1993-04-04"), faceToken: "face-tomas", accountNumber: "BCI-106", accountHolder: "Tomás Deslocado", salaryMzn: 8758, status: "DISPLACED", operatorId: "rh-chiure", unitId: U.escolaChiure },
      { id: P.beatriz, name: "Beatriz Namuoro", nuit: "500000007", identityCard: "110200007", bornAt: new Date("1995-05-05"), faceToken: "face-beatriz", accountNumber: "BCI-107", accountHolder: "Beatriz Namuoro", salaryMzn: 8758, operatorId: "rh-chiure", unitId: U.escolaChiure },
      { id: P.carlos, name: "Carlos Mussa", nuit: "500000008", identityCard: "110200008", bornAt: new Date("1992-02-22"), faceToken: "face-carlos", accountNumber: "BCI-108", accountHolder: "Carlos Mussa", salaryMzn: 8758, operatorId: "rh-chiure", unitId: U.escolaChiure },
      { id: P.enfermeiraTransito, name: "Nácia em Trânsito", nuit: "500000009", identityCard: "110200009", bornAt: new Date("1990-07-07"), faceToken: "face-nacia", accountNumber: "BIM-109", accountHolder: "Nácia em Trânsito", salaryMzn: 12000, status: "IN_TRANSIT", operatorId: "rh-marracuene", unitId: U.saudeMarracuene, transitStartedAt: daysAgo(12) },
      { id: P.enfermeiro, name: "Daniel Nhaca", nuit: "500000010", identityCard: "110200010", bornAt: new Date("1987-01-11"), faceToken: "face-daniel", accountNumber: "BIM-110", accountHolder: "Daniel Nhaca", salaryMzn: 12000, operatorId: "rh-marracuene", unitId: U.saudeMarracuene },
      { id: P.enfermeiraChiure, name: "Amina Saíde", nuit: "500000011", identityCard: "110200011", bornAt: new Date("1997-09-19"), faceToken: "face-amina", accountNumber: "BCI-111", accountHolder: "Amina Saíde", salaryMzn: 12000, operatorId: "rh-chiure", unitId: U.postoChiure },
      { id: P.policia, name: "Agente Paulo", nuit: "500000012", identityCard: "110200012", bornAt: new Date("1994-12-01"), faceToken: "face-paulo", accountNumber: "MCB-112", accountHolder: "Agente Paulo", salaryMzn: 11000, operatorId: "rh-pr", unitId: U.esquadra },
      { id: P.reformado, name: "António Reformado", nuit: "500000013", identityCard: "110200013", bornAt: new Date("1960-02-01"), faceToken: "face-antonio", accountNumber: "BIM-113", accountHolder: "António Reformado", salaryMzn: 15000, operatorId: "rh-maefp", unitId: U.nacional },
      { id: P.pensao, name: "Graça Salário e Pensão", nuit: "500000014", identityCard: "110200014", bornAt: new Date("1965-06-06"), faceToken: "face-graca", accountNumber: "BIM-114", accountHolder: "Graça Salário e Pensão", salaryMzn: 15000, receivesPension: true, operatorId: "rh-maefp", unitId: U.nacional },
      { id: P.ficticio, name: "Nome Fictício", nuit: "500000015", identityCard: "110200015", bornAt: new Date("1980-01-01"), faceToken: "face-ficticio", accountNumber: "FAM-999", accountHolder: "Familiar do Gestor", salaryMzn: 8758, status: "ADMISSION_PENDING", operatorId: "rh-fraude", createdWithoutProcess: true, unitId: U.escolaMarracuene },
      { id: P.cloneRosto, name: "Segundo Registo", nuit: "500000016", identityCard: "110200016", bornAt: new Date("1996-03-03"), faceToken: "face-pedro", accountNumber: "BIM-116", accountHolder: "Segundo Registo", salaryMzn: 8758, operatorId: "rh-fraude", createdWithoutProcess: true, unitId: U.nacional },
      { id: P.semUnidade, name: "Sem Posto", nuit: "500000017", identityCard: "110200017", bornAt: new Date("1989-08-08"), faceToken: "face-semposto", accountNumber: "BIM-117", accountHolder: "Sem Posto", salaryMzn: 8758, status: "NO_UNIT", operatorId: "rh-marracuene", unitId: null, unclaimedSince: daysAgo(70) },
      { id: P.contaPartilhadaA, name: "Irmão A", nuit: "500000018", identityCard: "110200018", bornAt: new Date("1991-01-01"), faceToken: "face-irmao-a", accountNumber: "PARTILHA-1", accountHolder: "Irmão A", salaryMzn: 8758, operatorId: "rh-fraude", unitId: U.esquadra },
      { id: P.contaPartilhadaB, name: "Irmão B", nuit: "500000019", identityCard: "110200019", bornAt: new Date("1992-01-01"), faceToken: "face-irmao-b", accountNumber: "PARTILHA-1", accountHolder: "Irmão B", salaryMzn: 8758, operatorId: "rh-fraude", unitId: U.esquadra },
      { id: P.fantasma1, name: "Fantasma Um", nuit: "500000020", identityCard: "110200020", bornAt: new Date("1984-01-01"), faceToken: "face-f1", accountNumber: "FRAUDE-1", accountHolder: "Fantasma Um", salaryMzn: 8758, operatorId: "rh-fraude", createdWithoutProcess: true, unitId: U.semChefe },
      { id: P.fantasma2, name: "Fantasma Dois", nuit: "500000021", identityCard: "110200021", bornAt: new Date("1984-02-01"), faceToken: "face-f2", accountNumber: "FRAUDE-2", accountHolder: "Fantasma Dois", salaryMzn: 8758, operatorId: "rh-fraude", createdWithoutProcess: true, unitId: U.semChefe },
      { id: P.fantasma3, name: "Fantasma Três", nuit: "500000022", identityCard: "110200022", bornAt: new Date("1984-03-01"), faceToken: "face-f3", accountNumber: "FRAUDE-3", accountHolder: "Fantasma Três", salaryMzn: 8758, operatorId: "rh-fraude", createdWithoutProcess: true, unitId: U.semChefe },
      { id: P.fantasma4, name: "Fantasma Quatro", nuit: "500000023", identityCard: "110200023", bornAt: new Date("1984-04-01"), faceToken: "face-f4", accountNumber: "FRAUDE-4", accountHolder: "Fantasma Quatro", salaryMzn: 8758, operatorId: "rh-fraude", createdWithoutProcess: true, unitId: U.semChefe },
      { id: P.admissaoPendente, name: "Docente Novo Chiúre", nuit: "500000024", identityCard: "110200024", bornAt: new Date("2000-01-15"), faceToken: "face-novo", accountNumber: "BCI-124", accountHolder: "Docente Novo Chiúre", salaryMzn: 8758, status: "ADMISSION_PENDING", operatorId: "rh-chiure", unitId: U.escolaChiure },
    ],
  });

  await prisma.folhaUnit.update({ where: { id: U.escolaMarracuene }, data: { chiefEmployeeId: P.chefeEscolaM, deputyEmployeeId: P.pedro } });
  await prisma.folhaUnit.update({ where: { id: U.saudeMarracuene }, data: { chiefEmployeeId: P.chefeSaudeM } });
  await prisma.folhaUnit.update({ where: { id: U.escolaChiure }, data: { chiefEmployeeId: P.chefeEscolaC } });
  await prisma.folhaUnit.update({ where: { id: U.postoChiure }, data: { chiefEmployeeId: P.chefePostoC } });
  await prisma.folhaUnit.update({ where: { id: U.esquadra }, data: { chiefEmployeeId: P.chefeEsquadra } });
  await prisma.folhaUnit.update({ where: { id: U.nacional }, data: { chiefEmployeeId: P.chefeNacional } });
  await prisma.folhaUnit.update({ where: { id: U.marracueneEdu }, data: { chiefEmployeeId: P.chefeMarracueneEdu } });
  await prisma.folhaUnit.update({ where: { id: U.chiureEdu }, data: { chiefEmployeeId: P.chefeChiureEdu } });

  await prisma.folhaAttestation.createMany({
    data: [
      { cycleId: cycle.id, unitId: U.escolaMarracuene, employeeId: P.chefeEscolaM, mark: "PRESENT" },
      { cycleId: cycle.id, unitId: U.escolaMarracuene, employeeId: P.ana, mark: "LEFT", justification: "Marcada como abandono pelo chefe", warnedAt: daysAgo(3) },
      { cycleId: cycle.id, unitId: U.escolaMarracuene, employeeId: P.joaoFalecido, mark: "PRESENT" },
      { cycleId: cycle.id, unitId: U.escolaMarracuene, employeeId: P.mariaEmigrou, mark: "PRESENT" },
      { cycleId: cycle.id, unitId: U.escolaMarracuene, employeeId: P.pedro, mark: "PRESENT" },
      { cycleId: cycle.id, unitId: U.escolaMarracuene, employeeId: P.lucia, mark: "PRESENT" },
      { cycleId: cycle.id, unitId: U.escolaChiure, employeeId: P.chefeEscolaC, mark: "PRESENT", createdOffline: true, synced: false },
      { cycleId: cycle.id, unitId: U.escolaChiure, employeeId: P.tomasDeslocado, mark: "ON_LEAVE", justification: "Deslocado por ataques em Chiúre", createdOffline: true, synced: false },
      { cycleId: cycle.id, unitId: U.saudeMarracuene, employeeId: P.chefeSaudeM, mark: "PRESENT" },
      { cycleId: cycle.id, unitId: U.saudeMarracuene, employeeId: P.enfermeiraTransito, mark: "TRANSFERRED" },
      { cycleId: cycle.id, unitId: U.saudeMarracuene, employeeId: P.enfermeiro, mark: "PRESENT" },
      { cycleId: cycle.id, unitId: U.nacional, employeeId: P.chefeNacional, mark: "PRESENT" },
      { cycleId: cycle.id, unitId: U.nacional, employeeId: P.reformado, mark: "PRESENT" },
      { cycleId: cycle.id, unitId: U.nacional, employeeId: P.pensao, mark: "PRESENT" },
    ],
  });

  const unitStaff = [
    { unitId: U.escolaMarracuene, ids: [P.chefeEscolaM, P.ana, P.joaoFalecido, P.mariaEmigrou, P.pedro, P.lucia] },
    { unitId: U.escolaChiure, ids: [P.chefeEscolaC, P.tomasDeslocado, P.beatriz, P.carlos, P.admissaoPendente] },
    { unitId: U.saudeMarracuene, ids: [P.chefeSaudeM, P.enfermeiraTransito, P.enfermeiro] },
  ];
  for (const unit of unitStaff) {
    const drawn = pickMonthlyDraw({ employeeIds: unit.ids, drawnThisYear: {}, month: 10, extraPerUnit: 1 });
    await prisma.folhaDraw.createMany({
      data: drawn.map((employeeId) => ({
        cycleId: cycle.id,
        unitId: unit.unitId,
        employeeId,
        photoResult: employeeId === P.mariaEmigrou ? "NO_SHOW" : employeeId === P.joaoFalecido ? "NO_SHOW" : employeeId === P.pedro ? "MATCH" : null,
        completedAt: employeeId === P.pedro || employeeId === P.mariaEmigrou || employeeId === P.joaoFalecido ? daysAgo(1) : null,
      })),
    });
  }

  await prisma.folhaAudit.createMany({
    data: [
      { cycleId: cycle.id, unitId: U.escolaMarracuene, employeeId: P.joaoFalecido, attestedAs: "PRESENT", foundPresent: false },
      { cycleId: cycle.id, unitId: U.escolaMarracuene, employeeId: P.pedro, attestedAs: "PRESENT", foundPresent: true },
    ],
  });

  await prisma.folhaMovement.createMany({
    data: [
      { type: "TRANSFER", employeeId: P.enfermeiraTransito, fromUnitId: U.postoChiure, toUnitId: U.saudeMarracuene, createdBy: "chefe-chiure", occurredAt: daysAgo(12) },
      { type: "ADMISSION", employeeId: P.admissaoPendente, toUnitId: U.escolaChiure, createdBy: "rh-chiure", occurredAt: daysAgo(40) },
      { type: "ADMISSION", employeeId: P.pedro, toUnitId: U.escolaMarracuene, createdBy: "rh-marracuene", acceptedBy: "Ilda Muianga", occurredAt: daysAgo(200), acceptedAt: daysAgo(198) },
    ],
  });

  await prisma.folhaContest.create({
    data: {
      cycleId: cycle.id,
      employeeId: P.ana,
      status: "OPEN",
      reason: "O chefe marcou abandono depois de um desentendimento. Continuo na escola todos os dias.",
    },
  });

  await prisma.folhaCase.create({
    data: {
      type: "DISCIPLINARY",
      employeeId: P.joaoFalecido,
      detail: "Chefe atestou presente uma pessoa que a auditoria não encontrou.",
    },
  });

  const employees = await prisma.folhaEmployee.findMany();
  const units = await prisma.folhaUnit.findMany({ include: { employees: true, toMovements: true } });
  const alerts = detectAnomalies(
    employees,
    units.map((unit) => ({
      id: unit.id,
      name: unit.name,
      chiefEmployeeId: unit.chiefEmployeeId,
      staffCount: unit.employees.length,
      admissionCount: unit.toMovements.filter((movement) => movement.type === "ADMISSION").length,
    })),
    new Date("2026-10-03T00:00:00Z"),
  );
  if (alerts.length > 0) {
    await prisma.folhaAnomaly.createMany({
      data: alerts.map((alert) => ({
        cycleId: cycle.id,
        type: alert.type,
        risk: alert.risk,
        employeeId: alert.employeeId,
        unitId: alert.unitId,
        detail: alert.detail,
      })),
    });
  }
}
