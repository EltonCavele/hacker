import { EmptyState } from "@/components/ui/empty-state";
import { SignMonth } from "@/features/folha/components/sign-month";
import { getActiveCycle, getUnitRoster, getUnits } from "@/features/folha/queries";

export default async function AssinarPage() {
  const [cycle, units] = await Promise.all([getActiveCycle(), getUnits()]);
  if (!cycle) return <EmptyState title="Sem ciclo de folha" description="Corre o seed da Folha Viva." />;
  const unitId = units.find((unit) => unit.type === "escola" && unit.district === "Marracuene")?.id ?? units[0]?.id;
  if (!unitId) return <EmptyState title="Sem unidades" description="Ainda não há unidades." />;
  const roster = await getUnitRoster(cycle.id, unitId);
  const team = roster.employees.filter((employee) => employee.id !== roster.unit?.chiefEmployeeId);
  const counts = { present: 0, leave: 0, transit: 0, unknown: 0 };
  for (const employee of team) {
    const mark = roster.attestations.get(employee.id)?.mark;
    if (mark === "PRESENT") counts.present += 1;
    else if (mark === "ON_LEAVE") counts.leave += 1;
    else if (employee.status === "IN_TRANSIT") counts.transit += 1;
    else if (mark === "UNKNOWN") counts.unknown += 1;
  }
  return (
    <SignMonth
      chiefName={roster.unit?.chief?.name ?? "chefe"}
      cycleId={cycle.id}
      drawsDone={roster.draws.filter((draw) => draw.photoResult).length}
      drawsTotal={roster.draws.length}
      leave={counts.leave}
      present={counts.present}
      transit={counts.transit}
      unitId={unitId}
      unknown={counts.unknown}
    />
  );
}
