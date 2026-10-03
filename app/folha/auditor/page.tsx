import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AuditButtons } from "@/features/folha/components/audit-buttons";
import { FolhaBadge } from "@/features/folha/components/folha-badge";
import { ResolveContestButtons } from "@/features/folha/components/folha-actions";
import { getSession } from "@/features/auth/queries";
import { getActiveCycle, getAuditQueue } from "@/features/folha/queries";
import { getFolhaRole } from "@/features/folha/role";
import { prisma } from "@/lib/db/client";

export default async function AuditorPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if ((await getFolhaRole()) !== "auditor") redirect("/folha");
  const cycle = await getActiveCycle();
  if (!cycle) return <EmptyState title="Sem ciclo de folha" description="Corre o seed da Folha Viva." />;
  const { units, riskyUnitIds, audits, attestByEmployee } = await getAuditQueue(cycle.id);
  const contests = await prisma.folhaContest.findMany({ where: { cycleId: cycle.id }, include: { employee: true }, orderBy: { createdAt: "desc" } });
  const priority = units.filter((unit) => riskyUnitIds.has(unit.id) || unit.conflictZone);

  return (
    <div className="space-y-8 px-5 pt-6 md:px-8">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-primary">Auditoria C5</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Amostra sem aviso</h1>
        <p className="mt-2 text-muted-foreground">Visitas às unidades de risco. A diferença com a atestação do chefe é o indicador do distrito.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Fila deste trimestre</CardTitle>
          <CardDescription>Unidades com alerta alto, conflito ou ainda sem visita.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {priority.map((unit) => (
            <section className="space-y-3" key={unit.id}>
              <div>
                <h2 className="font-medium">{unit.name}</h2>
                <p className="text-sm text-muted-foreground">{unit.district}, {unit.province}{unit.chief ? ` · Chefe ${unit.chief.name}` : " · sem chefe"}</p>
              </div>
              <Table aria-label={`Equipa de ${unit.name}`}>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Chefe disse</TableHead>
                    <TableHead>Visita</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unit.employees.map((employee) => {
                    const attested = attestByEmployee.get(employee.id);
                    const visit = audits.find((audit) => audit.employeeId === employee.id);
                    return (
                      <TableRow key={employee.id}>
                        <TableCell>{employee.name}</TableCell>
                        <TableCell>{attested ? <FolhaBadge value={attested.mark} /> : "—"}</TableCell>
                        <TableCell>
                          {visit ? (visit.foundPresent ? "Encontrado" : "Ausente") : <AuditButtons employeeId={employee.id} unitId={unit.id} />}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </section>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Contestações</CardTitle>
          <CardDescription>Uma marcação negativa só corta depois de verificação independente.</CardDescription>
        </CardHeader>
        <CardContent>
          {contests.length === 0 ? (
            <p className="text-sm text-muted-foreground">Não há contestações neste ciclo.</p>
          ) : (
            <ul className="space-y-4">
              {contests.map((contest) => (
                <li className="space-y-2" key={contest.id}>
                  <p className="font-medium">{contest.employee.name}</p>
                  <p className="text-sm text-muted-foreground">{contest.reason}</p>
                  {contest.status === "OPEN" ? <ResolveContestButtons contestId={contest.id} /> : <FolhaBadge value={contest.status} />}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
