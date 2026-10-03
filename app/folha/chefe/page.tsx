import { redirect } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { AttestationRoster } from "@/features/folha/components/attestation-roster";
import { UnlockGate } from "@/features/folha/components/unlock-gate";
import { getActiveCycle, getUnitRoster, getUnits } from "@/features/folha/queries";

function pickUnit(units: Array<{ id: string; type: string; district: string }>, unitId?: string) {
  if (unitId && units.some((unit) => unit.id === unitId)) return unitId;
  return units.find((unit) => unit.type === "escola" && unit.district === "Marracuene")?.id ?? units[0]?.id;
}

export default async function ChefePage({ searchParams }: { searchParams: Promise<{ unit?: string }> }) {
  const [{ unit: unitId }, cycle, units] = await Promise.all([searchParams, getActiveCycle(), getUnits()]);
  if (!cycle) return <EmptyState title="Sem ciclo de folha" description="Corre o seed da Folha Viva para criar o mês de demonstração." />;
  const selected = pickUnit(units, unitId);
  if (!selected) return <EmptyState title="Sem unidades" description="Ainda não há unidades de trabalho registadas." />;
  const roster = await getUnitRoster(cycle.id, selected);
  if (!roster.unit) redirect("/folha/chefe");
  const team = roster.employees.filter((employee) => employee.id !== roster.unit?.chiefEmployeeId);
  const attestations = Object.fromEntries(
    [...roster.attestations.entries()].map(([id, row]) => [id, { mark: row.mark, justification: row.justification, createdOffline: row.createdOffline }]),
  );
  const chiefName = roster.unit.chief?.name ?? "Chefe";

  return (
    <UnlockGate
      queued={0}
      unitMeta={`${roster.unit.district} · Educação · ${team.length} funcionários`}
      unitName={roster.unit.name}
    >
      <AttestationRoster
        attestations={attestations}
        chiefName={chiefName}
        remainingDays={Math.max(0, Math.ceil((cycle.closesAt.getTime() - Date.now()) / 86_400_000))}
        cycleId={cycle.id}
        draws={roster.draws.map((draw) => ({ id: draw.id, employeeId: draw.employeeId, employeeName: draw.employee.name, photoResult: draw.photoResult }))}
        employees={team}
        unit={roster.unit}
        yearMonth={cycle.yearMonth}
      />
    </UnlockGate>
  );
}
