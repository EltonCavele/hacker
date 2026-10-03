import { EmptyState } from "@/components/ui/empty-state";
import { SyncQueue } from "@/features/folha/components/sync-queue";
import { getActiveCycle, getUnitRoster, getUnits } from "@/features/folha/queries";

export default async function FilaPage() {
  const [cycle, units] = await Promise.all([getActiveCycle(), getUnits()]);
  if (!cycle) return <EmptyState title="Sem ciclo de folha" description="Corre o seed da Folha Viva." />;
  const unitId = units.find((unit) => unit.type === "escola" && unit.district === "Marracuene")?.id ?? units[0]?.id;
  if (!unitId) return <EmptyState title="Sem unidades" description="Ainda não há unidades." />;
  const roster = await getUnitRoster(cycle.id, unitId);
  const team = roster.employees.filter((employee) => employee.id !== roster.unit?.chiefEmployeeId);
  return (
    <SyncQueue
      chiefName={roster.unit?.chief?.name ?? "chefe"}
      cycleId={cycle.id}
      draws={roster.draws.map((draw) => ({ employeeName: draw.employee.name, photoResult: draw.photoResult }))}
      staffCount={team.length}
      unitId={unitId}
      yearMonth={cycle.yearMonth}
    />
  );
}
