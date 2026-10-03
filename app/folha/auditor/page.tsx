import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { directionUnitsFrom, summarizeAuditDirections } from "@/features/folha/directions";
import { getActiveCycle, getAuditQueue } from "@/features/folha/queries";
import { prisma } from "@/lib/db/client";

export default async function AuditorPage() {
  const cycle = await getActiveCycle();
  if (!cycle) {
    return (
      <>
        <PageHeader title="Auditoria" />
        <div className="px-6 pb-16 pt-6">
          <EmptyState title="Sem ciclo de folha" description="Corre o seed da Folha Viva." />
        </div>
      </>
    );
  }

  const { units, riskyUnitIds, audits } = await getAuditQueue(cycle.id);
  const contests = await prisma.folhaContest.findMany({
    where: { cycleId: cycle.id, status: "OPEN" },
    select: { employeeId: true },
  });
  const openContestIds = new Set(contests.map((contest) => contest.employeeId));
  const visitedIds = new Set(audits.map((audit) => audit.employeeId));
  const discrepancyIds = new Set(
    audits.filter((audit) => audit.attestedAs === "PRESENT" && !audit.foundPresent).map((audit) => audit.employeeId),
  );
  const directions = summarizeAuditDirections(
    directionUnitsFrom(units),
    units.flatMap((unit) =>
      unit.employees.map((employee) => ({
        unitId: unit.id,
        visited: visitedIds.has(employee.id),
        discrepancy: discrepancyIds.has(employee.id),
        atRisk: riskyUnitIds.has(unit.id) || unit.conflictZone,
        openContest: openContestIds.has(employee.id),
      })),
    ),
  );

  return (
    <>
      <PageHeader title="Auditoria" />
      <div className="flex flex-col gap-8 px-6 pb-16 pt-6">
        <section className="space-y-2">
          <h2 className="text-lg font-medium">Ciclo {cycle.yearMonth}</h2>
          <p className="max-w-2xl leading-7 text-muted-foreground">
            Uma tabela por direcção. Abre a direcção para ver cada pessoa, a atestação do chefe e a visita.
          </p>
        </section>

        <section className="space-y-5 border-t pt-6">
          <div className="space-y-1">
            <h2 className="text-lg font-medium">Direcções</h2>
            <p className="text-muted-foreground">Escolas e postos entram na direcção a que pertencem.</p>
          </div>
          {directions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma direcção neste ciclo.</p>
          ) : (
            <Table aria-label="Direcções para auditar">
              <TableHeader>
                <TableRow>
                  <TableHead>Direcção</TableHead>
                  <TableHead mobileHidden>Município</TableHead>
                  <TableHead className="text-right">Unidades</TableHead>
                  <TableHead className="text-right">Pessoas</TableHead>
                  <TableHead className="text-right" mobileHidden>
                    Visitadas
                  </TableHead>
                  <TableHead className="text-right">Discrepâncias</TableHead>
                  <TableHead className="text-right" mobileHidden>
                    Contestações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {directions.map((direction) => (
                  <TableRow className="relative" key={direction.id}>
                    <TableCell className="font-medium">
                      <Link className="after:absolute after:inset-0" href={`/folha/auditor/${direction.id}`}>
                        {direction.name}
                      </Link>
                    </TableCell>
                    <TableCell mobileHidden>{direction.district ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{direction.unitIds.length}</TableCell>
                    <TableCell className="text-right tabular-nums">{direction.staff}</TableCell>
                    <TableCell className="text-right tabular-nums" mobileHidden>
                      {direction.visited}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{direction.discrepancies}</TableCell>
                    <TableCell className="text-right tabular-nums" mobileHidden>
                      {direction.openContests}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>
      </div>
    </>
  );
}
