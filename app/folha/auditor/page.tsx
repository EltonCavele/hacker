import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { AuditButtons } from "@/features/folha/components/audit-buttons";
import { FolhaBadge } from "@/features/folha/components/folha-badge";
import { ResolveContestButtons } from "@/features/folha/components/folha-actions";
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
  const { units, riskyUnitIds, audits, attestByEmployee } = await getAuditQueue(cycle.id);
  const contests = await prisma.folhaContest.findMany({
    where: { cycleId: cycle.id },
    include: { employee: true },
    orderBy: { createdAt: "desc" },
  });
  const priority = units.filter((unit) => riskyUnitIds.has(unit.id) || unit.conflictZone);

  return (
    <>
      <PageHeader title="Auditoria" />
      <div className="flex flex-col gap-8 px-6 pb-16 pt-6">
        <section className="space-y-2">
          <h2 className="text-lg font-medium">Amostra sem aviso</h2>
          <p className="max-w-2xl leading-7 text-muted-foreground">
            Ciclo {cycle.yearMonth}. Visitas às unidades de risco. A diferença com a atestação do chefe é o indicador do distrito.
          </p>
        </section>

        <section className="space-y-5 border-t pt-6">
          <div className="space-y-1">
            <h2 className="text-lg font-medium">Fila deste trimestre</h2>
            <p className="text-muted-foreground">Unidades com alerta alto, conflito ou ainda sem visita.</p>
          </div>
          {priority.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma unidade na fila.</p>
          ) : (
            <div className="space-y-8">
              {priority.map((unit) => (
                <div key={unit.id}>
                  <h3 className="font-medium">{unit.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {unit.district}, {unit.province}
                    {unit.chief ? ` · Chefe ${unit.chief.name}` : " · sem chefe"}
                  </p>
                  <ul className="mt-2 divide-y divide-border">
                    {unit.employees.map((employee) => {
                      const attested = attestByEmployee.get(employee.id);
                      const visit = audits.find((audit) => audit.employeeId === employee.id);
                      return (
                        <li className="flex flex-wrap items-center justify-between gap-3 py-3" key={employee.id}>
                          <div className="min-w-0">
                            <p className="font-medium">{employee.name}</p>
                            <p className="text-sm text-muted-foreground">{attested ? "Atestado pelo chefe" : "Ainda sem atestação"}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {attested ? <FolhaBadge value={attested.mark} /> : null}
                            {visit ? (
                              <span className="text-sm text-muted-foreground">{visit.foundPresent ? "Encontrado" : "Ausente"}</span>
                            ) : (
                              <AuditButtons employeeId={employee.id} unitId={unit.id} />
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-5 border-t pt-6">
          <div className="space-y-1">
            <h2 className="text-lg font-medium">Contestações</h2>
            <p className="text-muted-foreground">Uma marcação negativa só corta depois de verificação independente.</p>
          </div>
          {contests.length === 0 ? (
            <p className="text-sm text-muted-foreground">Não há contestações neste ciclo.</p>
          ) : (
            <ul className="divide-y divide-border">
              {contests.map((contest) => (
                <li className="flex flex-wrap items-center justify-between gap-3 py-4" key={contest.id}>
                  <div className="min-w-0 max-w-xl">
                    <p className="font-medium">{contest.employee.name}</p>
                    <p className="text-sm leading-6 text-muted-foreground">{contest.reason}</p>
                  </div>
                  {contest.status === "OPEN" ? <ResolveContestButtons contestId={contest.id} /> : <FolhaBadge value={contest.status} />}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
