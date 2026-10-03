import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuditButtons } from "@/features/folha/components/audit-buttons";
import { FolhaBadge } from "@/features/folha/components/folha-badge";
import { ResolveContestButtons } from "@/features/folha/components/folha-actions";
import { directionIdFor, directionUnitsFrom, summarizeAuditDirections } from "@/features/folha/directions";
import { getActiveCycle, getAuditQueue } from "@/features/folha/queries";
import { prisma } from "@/lib/db/client";

export default async function AuditorDirectionPage({ params }: { params: Promise<{ unitId: string }> }) {
  const { unitId } = await params;
  const cycle = await getActiveCycle();
  if (!cycle) {
    return (
      <>
        <PageHeader back={{ href: "/folha/auditor", label: "Auditoria" }} title="Auditoria" />
        <div className="px-6 pb-16 pt-6">
          <EmptyState title="Sem ciclo de folha" description="Corre o seed da Folha Viva." />
        </div>
      </>
    );
  }

  const [{ units, riskyUnitIds, audits, attestByEmployee }, contests] = await Promise.all([
    getAuditQueue(cycle.id),
    prisma.folhaContest.findMany({
      where: { cycleId: cycle.id },
      include: { employee: { include: { unit: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const openContestIds = new Set(
    contests.filter((contest) => contest.status === "OPEN").map((contest) => contest.employeeId),
  );
  const visitByEmployee = new Map(audits.map((audit) => [audit.employeeId, audit]));
  const directionUnits = directionUnitsFrom(units);
  const direction = summarizeAuditDirections(
    directionUnits,
    units.flatMap((unit) =>
      unit.employees.map((employee) => ({
        unitId: unit.id,
        visited: visitByEmployee.has(employee.id),
        discrepancy:
          visitByEmployee.get(employee.id)?.attestedAs === "PRESENT" &&
          visitByEmployee.get(employee.id)?.foundPresent === false,
        atRisk: riskyUnitIds.has(unit.id) || unit.conflictZone,
        openContest: openContestIds.has(employee.id),
      })),
    ),
  ).find((item) => item.id === unitId);

  if (!direction) {
    return (
      <>
        <PageHeader back={{ href: "/folha/auditor", label: "Auditoria" }} title="Auditoria" />
        <div className="px-6 pb-16 pt-6">
          <EmptyState title="Direcção não encontrada" description="Esta direcção não entra na amostra deste ciclo." />
        </div>
      </>
    );
  }

  const unitById = new Map(directionUnits.map((unit) => [unit.id, unit]));
  const memberIds = new Set(direction.unitIds);
  const people = units
    .filter((unit) => memberIds.has(unit.id))
    .flatMap((unit) => unit.employees.map((employee) => ({ employee, unit })))
    .sort((left, right) => left.employee.name.localeCompare(right.employee.name, "pt"));
  const directionContests = contests.filter(
    (contest) => directionIdFor(contest.employee.unitId, unitById) === direction.id,
  );
  const included = directionUnits
    .filter((unit) => memberIds.has(unit.id) && unit.id !== direction.id)
    .map((unit) => unit.name);
  const place = direction.district ? `${direction.district}, ${direction.province}` : "Sem posto atribuído";

  return (
    <>
      <PageHeader back={{ href: "/folha/auditor", label: "Auditoria" }} title={direction.name} />
      <div className="flex flex-col gap-8 px-6 pb-16 pt-6">
        <section className="space-y-5">
          <div className="space-y-2">
            <h2 className="text-lg font-medium">{place}</h2>
            <p className="max-w-2xl leading-7 text-muted-foreground">
              {direction.chiefName ? `Chefe ${direction.chiefName}.` : "Sem chefe nomeado."}
              {included.length > 0 ? ` Inclui ${included.join(", ")}.` : ""}
              {direction.atRisk > 0 ? ` ${direction.atRisk} pessoas em unidade de risco ou zona de conflito.` : ""}
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-3">
            <Card className="border">
              <CardHeader>
                <CardDescription>Pessoas</CardDescription>
                <CardTitle className="text-2xl tabular-nums">{direction.staff}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border">
              <CardHeader>
                <CardDescription>Visitadas</CardDescription>
                <CardTitle className="text-2xl tabular-nums">{direction.visited}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border">
              <CardHeader>
                <CardDescription>Discrepâncias</CardDescription>
                <CardTitle className="text-2xl tabular-nums">{direction.discrepancies}</CardTitle>
              </CardHeader>
            </Card>
          </dl>
        </section>

        <Tabs defaultValue="pessoas">
          <TabsList className="w-full">
            <TabsTrigger value="pessoas">Pessoas</TabsTrigger>
            <TabsTrigger value="contestacoes">Contestações</TabsTrigger>
          </TabsList>
          <TabsContent className="text-base" value="pessoas">
            <p className="py-4 text-muted-foreground">A diferença entre a atestação do chefe e a visita é a discrepância.</p>
            {people.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ninguém nesta direcção.</p>
            ) : (
              <Table aria-label={`Pessoas de ${direction.name}`}>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pessoa</TableHead>
                    <TableHead mobileHidden>Unidade</TableHead>
                    <TableHead>Atestação</TableHead>
                    <TableHead>Visita</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {people.map(({ employee, unit }) => {
                    const attested = attestByEmployee.get(employee.id);
                    const visit = visitByEmployee.get(employee.id);
                    return (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">{employee.name}</TableCell>
                        <TableCell mobileHidden>{unit.name}</TableCell>
                        <TableCell>{attested ? <FolhaBadge value={attested.mark} /> : "Sem atestação"}</TableCell>
                        <TableCell>
                          {visit ? (
                            <span>{visit.foundPresent ? "Encontrado" : "Ausente"}</span>
                          ) : (
                            <AuditButtons employeeId={employee.id} unitId={unit.id} />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </TabsContent>
          <TabsContent className="text-base" value="contestacoes">
            <p className="py-4 text-muted-foreground">Uma marcação negativa só corta depois de verificação independente.</p>
            {directionContests.length === 0 ? (
              <p className="text-sm text-muted-foreground">Não há contestações nesta direcção.</p>
            ) : (
              <Table aria-label={`Contestações de ${direction.name}`}>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pessoa</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {directionContests.map((contest) => (
                    <TableRow key={contest.id}>
                      <TableCell className="font-medium">{contest.employee.name}</TableCell>
                      <TableCell className="max-w-md whitespace-normal">{contest.reason}</TableCell>
                      <TableCell>
                        {contest.status === "OPEN" ? (
                          <ResolveContestButtons contestId={contest.id} />
                        ) : (
                          <FolhaBadge value={contest.status} />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
