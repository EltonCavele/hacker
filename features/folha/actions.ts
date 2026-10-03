"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { loginRedirectPath } from "@/features/auth/redirect-to-login";
import { getSession } from "@/features/auth/queries";
import { prisma } from "@/lib/db/client";
import { RATE_LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import { getActiveCycle } from "./queries";
import { getFolhaRole } from "./role";
import { FOLHA_ROLE_COOKIE, isFolhaRole, isNegativeMark, type FolhaRole } from "./types";

const markSchema = z.enum(["PRESENT", "ABSENT_JUSTIFIED", "ON_LEAVE", "TRANSFERRED", "LEFT", "DECEASED", "UNKNOWN"]);
const photoSchema = z.enum(["MATCH", "NO_SHOW", "LOCATION_FAIL", "NOT_A_LIVE_FACE"]);

async function requireRole(allowed: FolhaRole[]) {
  const session = await getSession();
  if (!session) redirect(await loginRedirectPath("/folha"));
  const role = await getFolhaRole();
  if (!allowed.includes(role)) throw new Error("folha-role");
  return { id: session.user.id };
}

function refresh() {
  revalidatePath("/folha", "layout");
}

export async function setFolhaRole(role: string) {
  const session = await getSession();
  if (!session) redirect(await loginRedirectPath("/folha"));
  if (!isFolhaRole(role)) return;
  (await cookies()).set(FOLHA_ROLE_COOKIE, role, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
  refresh();
}

export async function saveAttestation(input: {
  unitId: string;
  employeeId: string;
  mark: string;
  justification?: string;
  createdOffline?: boolean;
}) {
  const user = await requireRole(["chief"]);
  if (await enforceRateLimit("folha-attest", user.id, RATE_LIMITS.userWrite)) return { error: "rate" };
  const mark = markSchema.parse(input.mark);
  const cycle = await getActiveCycle();
  if (!cycle) return { error: "cycle" };
  const unit = await prisma.folhaUnit.findUnique({ where: { id: input.unitId } });
  if (!unit) return { error: "unit" };
  await prisma.folhaAttestation.upsert({
    where: { cycleId_employeeId: { cycleId: cycle.id, employeeId: input.employeeId } },
    create: {
      cycleId: cycle.id,
      unitId: input.unitId,
      employeeId: input.employeeId,
      mark,
      justification: input.justification?.trim() || null,
      createdOffline: Boolean(input.createdOffline),
      synced: true,
    },
    update: {
      mark,
      justification: input.justification?.trim() || null,
      createdOffline: Boolean(input.createdOffline),
      synced: true,
      unitId: input.unitId,
    },
  });
  if (mark === "DECEASED") {
    await prisma.folhaEmployee.update({ where: { id: input.employeeId }, data: { status: "DECEASED" } });
    await prisma.folhaMovement.create({
      data: { type: "DEATH", employeeId: input.employeeId, fromUnitId: input.unitId, createdBy: user.id, occurredAt: new Date() },
    });
  }
  if (mark === "LEFT") {
    await prisma.folhaEmployee.update({ where: { id: input.employeeId }, data: { status: "LEFT" } });
  }
  refresh();
  return { error: null };
}

export async function syncOfflineAttestations(
  rows: Array<{ unitId: string; employeeId: string; mark: string; justification?: string }>,
) {
  for (const row of rows) {
    await saveAttestation({ ...row, createdOffline: true });
  }
  return { error: null };
}

export async function recordDrawPhoto(drawId: string, result: string) {
  const user = await requireRole(["chief"]);
  if (await enforceRateLimit("folha-draw", user.id, RATE_LIMITS.userWrite)) return { error: "rate" };
  const photoResult = photoSchema.parse(result);
  await prisma.folhaDraw.update({ where: { id: drawId }, data: { photoResult, completedAt: new Date() } });
  refresh();
  return { error: null };
}

export async function acceptTransfer(movementId: string) {
  const user = await requireRole(["chief", "cedsif"]);
  const movement = await prisma.folhaMovement.findUnique({ where: { id: movementId } });
  if (!movement || movement.type !== "TRANSFER" || !movement.toUnitId) return { error: "movement" };
  await prisma.folhaMovement.update({
    where: { id: movementId },
    data: { acceptedBy: user.id, acceptedAt: new Date() },
  });
  await prisma.folhaEmployee.update({
    where: { id: movement.employeeId },
    data: { status: "ACTIVE", unitId: movement.toUnitId, transitStartedAt: null },
  });
  refresh();
  return { error: null };
}

export async function recordAudit(input: { unitId: string; employeeId: string; foundPresent: boolean }) {
  const user = await requireRole(["auditor"]);
  if (await enforceRateLimit("folha-audit", user.id, RATE_LIMITS.userWrite)) return { error: "rate" };
  const cycle = await getActiveCycle();
  if (!cycle) return { error: "cycle" };
  const attestation = await prisma.folhaAttestation.findUnique({
    where: { cycleId_employeeId: { cycleId: cycle.id, employeeId: input.employeeId } },
  });
  await prisma.folhaAudit.create({
    data: {
      cycleId: cycle.id,
      unitId: input.unitId,
      employeeId: input.employeeId,
      attestedAs: attestation?.mark ?? null,
      foundPresent: input.foundPresent,
    },
  });
  refresh();
  return { error: null };
}

export async function sendNegativeMarkWarning(attestationId: string) {
  await requireRole(["cedsif", "chief"]);
  await prisma.folhaAttestation.update({ where: { id: attestationId }, data: { warnedAt: new Date() } });
  refresh();
  return { error: null };
}

export async function acceptAdmission(employeeId: string) {
  await requireRole(["chief", "cedsif"]);
  const employee = await prisma.folhaEmployee.findUnique({ where: { id: employeeId } });
  if (!employee) return { error: "missing" };
  if (employee.accountHolder.trim().toLowerCase() !== employee.name.trim().toLowerCase()) return { error: "account" };
  const sameFace = await prisma.folhaEmployee.count({ where: { faceToken: employee.faceToken, id: { not: employee.id } } });
  if (sameFace > 0) return { error: "face" };
  if (!employee.unitId) return { error: "unit" };
  const unit = await prisma.folhaUnit.findUnique({ where: { id: employee.unitId } });
  if (!unit?.chiefEmployeeId) return { error: "chief" };
  await prisma.folhaEmployee.update({ where: { id: employeeId }, data: { status: "ACTIVE", createdWithoutProcess: false } });
  await prisma.folhaMovement.create({
    data: {
      type: "ADMISSION",
      employeeId,
      toUnitId: employee.unitId,
      createdBy: "cedsif",
      acceptedBy: unit.chiefEmployeeId,
      occurredAt: new Date(),
      acceptedAt: new Date(),
    },
  });
  refresh();
  return { error: null };
}

export async function openContest(employeeId: string, reason: string) {
  const user = await requireRole(["employee"]);
  if (await enforceRateLimit("folha-contest", user.id, RATE_LIMITS.userSensitive)) return { error: "rate" };
  const parsed = z.string().trim().min(8).max(500).safeParse(reason);
  if (!parsed.success) return { error: "reason" };
  const cycle = await getActiveCycle();
  if (!cycle) return { error: "cycle" };
  await prisma.folhaContest.create({ data: { cycleId: cycle.id, employeeId, reason: parsed.data } });
  refresh();
  return { error: null };
}

export async function resolveContest(contestId: string, genuine: boolean) {
  await requireRole(["auditor", "cedsif"]);
  const contest = await prisma.folhaContest.findUnique({ where: { id: contestId } });
  if (!contest) return { error: "missing" };
  const resolvedAt = new Date();
  await prisma.folhaContest.update({
    where: { id: contestId },
    data: {
      status: genuine ? "VERIFIED_GENUINE" : "VERIFIED_GHOST",
      resolvedAt,
      reactivatedAt: genuine ? resolvedAt : null,
    },
  });
  if (genuine) {
    await prisma.folhaEmployee.update({ where: { id: contest.employeeId }, data: { status: "ACTIVE" } });
    await prisma.folhaAttestation.updateMany({
      where: { cycleId: contest.cycleId, employeeId: contest.employeeId },
      data: { mark: "PRESENT", warnedAt: null },
    });
  }
  refresh();
  return { error: null };
}

export async function openCase(employeeId: string, detail: string) {
  await requireRole(["cedsif"]);
  const parsed = z.string().trim().min(8).max(500).safeParse(detail);
  if (!parsed.success) return { error: "detail" };
  await prisma.folhaCase.create({ data: { type: "DISCIPLINARY", employeeId, detail: parsed.data } });
  refresh();
  return { error: null };
}

export async function wipeUnitDevice(unitId: string) {
  await requireRole(["cedsif", "chief"]);
  await prisma.folhaUnit.update({ where: { id: unitId }, data: { deviceWiped: true } });
  refresh();
  return { error: null };
}
