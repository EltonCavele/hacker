import { EmptyState } from "@/components/ui/empty-state";
import { DrawList } from "@/features/folha/components/attestation-roster";
import { getActiveCycle, getUnitRoster, getUnits } from "@/features/folha/queries";

export default async function SorteioPage() {
  const [cycle, units] = await Promise.all([getActiveCycle(), getUnits()]);
  if (!cycle) return <EmptyState title="Sem ciclo de folha" description="Corre o seed da Folha Viva." />;
  const unitId = units.find((unit) => unit.type === "escola" && unit.district === "Marracuene")?.id ?? units[0]?.id;
  if (!unitId) return <EmptyState title="Sem unidades" description="Ainda não há unidades." />;
  const roster = await getUnitRoster(cycle.id, unitId);
  return (
    <DrawList
      draws={roster.draws.map((draw) => ({
        id: draw.id,
        employeeName: draw.employee.name,
        photoResult: draw.photoResult,
      }))}
    />
  );
}
