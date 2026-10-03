import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { AcceptAdmissionButton, OpenCaseButton, WarnButton } from "@/features/folha/components/folha-actions";
import { FolhaBadge } from "@/features/folha/components/folha-badge";
import { getActiveCycle, getCedsifDesk } from "@/features/folha/queries";
import { isNegativeMark } from "@/features/folha/types";

export default async function CedsifPage() {
  const cycle = await getActiveCycle();
  if (!cycle) {
    return (
      <>
        <PageHeader title="CEDSIF" />
        <div className="px-6 pb-16 pt-6">
          <EmptyState title="Sem ciclo de folha" description="Corre o seed da Folha Viva." />
        </div>
      </>
    );
  }
  const desk = await getCedsifDesk(cycle.id);

  return (
    <>
      <PageHeader title="CEDSIF" />
      <div className="flex flex-col gap-8 px-6 pb-16 pt-6">
        <section className="space-y-2">
          <h2 className="text-lg font-medium">Folha de {cycle.yearMonth}</h2>
          <p className="max-w-2xl leading-7 text-muted-foreground">
            O pagamento só é automático quando as três fontes concordam. Nenhum alerta corta sozinho.
          </p>
        </section>

        {desk.unclaimed.length > 0 ? (
          <Alert variant="destructive">
            <AlertTitle>Sem unidade há mais de 60 dias</AlertTitle>
            <AlertDescription>{desk.unclaimed.map((row) => row.employee.name).join(", ")}</AlertDescription>
          </Alert>
        ) : null}

        <section className="space-y-5 border-t pt-6">
          <div className="space-y-1">
            <h2 className="text-lg font-medium">Regra de pagamento</h2>
            <p className="text-muted-foreground">Pagar, reter ou suspender, recalculado a partir das fontes.</p>
          </div>
          <ul className="divide-y divide-border">
            {desk.payroll.map((row) => (
              <li className="flex flex-wrap items-center justify-between gap-3 py-3" key={row.employee.id}>
                <div className="min-w-0">
                  <p className="font-medium">{row.employee.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {row.employee.unit?.name ?? "Sem unidade"} · {row.payment.reason}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <FolhaBadge value={row.payment.decision} />
                  {row.employee.status === "ADMISSION_PENDING" ? <AcceptAdmissionButton employeeId={row.employee.id} /> : null}
                  {row.attestation && isNegativeMark(row.attestation.mark) && !row.attestation.warnedAt ? (
                    <WarnButton attestationId={row.attestation.id} />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-5 border-t pt-6">
          <div className="space-y-1">
            <h2 className="text-lg font-medium">Motor de anomalias</h2>
            <p className="text-muted-foreground">Alto retém. Médio paga e entra na fila de verificação.</p>
          </div>
          <ul className="divide-y divide-border">
            {desk.anomalies.map((alert) => (
              <li className="flex flex-wrap items-center justify-between gap-3 py-3" key={alert.id}>
                <div className="min-w-0 max-w-xl">
                  <p className="font-medium">{alert.detail}</p>
                  <p className="text-sm text-muted-foreground">{alert.employee?.name ?? "Unidade"}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <FolhaBadge value={alert.type} />
                  <FolhaBadge value={alert.risk} />
                  {alert.employeeId ? <OpenCaseButton detail={alert.detail} employeeId={alert.employeeId} /> : null}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-5 border-t pt-6">
          <div className="space-y-1">
            <h2 className="text-lg font-medium">Movimentos e processos</h2>
            <p className="text-muted-foreground">Transferências, admissões e processos abertos neste ciclo.</p>
          </div>
          <ul className="divide-y divide-border">
            {desk.movements.map((movement) => (
              <li className="flex flex-wrap items-center justify-between gap-3 py-3" key={movement.id}>
                <div>
                  <p className="font-medium">{movement.employee.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {movement.toUnit ? `→ ${movement.toUnit.name}` : movement.fromUnit?.name ?? "Sem unidade"}
                    {movement.acceptedAt ? " · aceite" : movement.type === "TRANSFER" ? " · à espera da unidade de destino" : ""}
                  </p>
                </div>
                <FolhaBadge value={movement.type} />
              </li>
            ))}
            {desk.cases.map((item) => (
              <li className="flex flex-wrap items-center justify-between gap-3 py-3" key={item.id}>
                <div className="min-w-0 max-w-xl">
                  <p className="font-medium">{item.employee.name}</p>
                  <p className="text-sm leading-6 text-muted-foreground">{item.detail}</p>
                </div>
                <FolhaBadge value={item.type} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
