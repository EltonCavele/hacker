import { redirect } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AcceptAdmissionButton, OpenCaseButton, WarnButton } from "@/features/folha/components/folha-actions";
import { FolhaBadge } from "@/features/folha/components/folha-badge";
import { getSession } from "@/features/auth/queries";
import { getActiveCycle, getCedsifDesk } from "@/features/folha/queries";
import { getFolhaRole } from "@/features/folha/role";
import { isNegativeMark } from "@/features/folha/types";

export default async function CedsifPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if ((await getFolhaRole()) !== "cedsif") redirect("/folha");
  const cycle = await getActiveCycle();
  if (!cycle) return <EmptyState title="Sem ciclo de folha" description="Corre o seed da Folha Viva." />;
  const desk = await getCedsifDesk(cycle.id);

  return (
    <div className="space-y-8 px-5 pt-6 md:px-8">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-primary">Motor de anomalias</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Folha do mês</h1>
        <p className="mt-2 text-muted-foreground">O pagamento só é automático quando as três fontes concordam. Nenhum alerta corta sozinho.</p>
      </div>
      {desk.unclaimed.length > 0 ? (
        <Alert variant="destructive">
          <AlertTitle>Sem unidade há mais de 60 dias</AlertTitle>
          <AlertDescription>{desk.unclaimed.map((row) => row.employee.name).join(", ")}</AlertDescription>
        </Alert>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Regra de pagamento</CardTitle>
          <CardDescription>Pagar, reter ou suspender, recalculado a partir das fontes.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table aria-label="Folha do mês">
            <TableHeader>
              <TableRow>
                <TableHead>Funcionário</TableHead>
                <TableHead mobileHidden>Unidade</TableHead>
                <TableHead>Decisão</TableHead>
                <TableHead mobileHidden>Acção</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {desk.payroll.map((row) => (
                <TableRow key={row.employee.id}>
                  <TableCell>
                    <div className="font-medium">{row.employee.name}</div>
                    <div className="text-xs text-muted-foreground">{row.payment.reason}</div>
                  </TableCell>
                  <TableCell mobileHidden>{row.employee.unit?.name ?? "—"}</TableCell>
                  <TableCell>
                    <FolhaBadge value={row.payment.decision} />
                  </TableCell>
                  <TableCell mobileHidden>
                    {row.employee.status === "ADMISSION_PENDING" ? <AcceptAdmissionButton employeeId={row.employee.id} /> : null}
                    {row.attestation && isNegativeMark(row.attestation.mark) && !row.attestation.warnedAt ? (
                      <WarnButton attestationId={row.attestation.id} />
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Motor de anomalias</CardTitle>
          <CardDescription>Alto retém; médio paga e entra na fila de verificação.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table aria-label="Anomalias">
            <TableHeader>
              <TableRow>
                <TableHead>Risco</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Detalhe</TableHead>
                <TableHead mobileHidden>Processo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {desk.anomalies.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell>
                    <FolhaBadge value={alert.risk} />
                  </TableCell>
                  <TableCell>{alert.type}</TableCell>
                  <TableCell>{alert.detail}</TableCell>
                  <TableCell mobileHidden>
                    {alert.employeeId ? <OpenCaseButton detail={alert.detail} employeeId={alert.employeeId} /> : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Movimentos e processos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm">
            {desk.movements.map((movement) => (
              <li key={movement.id}>
                {movement.type} · {movement.employee.name}
                {movement.toUnit ? ` → ${movement.toUnit.name}` : ""}
                {movement.acceptedAt ? " · aceite" : movement.type === "TRANSFER" ? " · à espera da unidade de destino" : ""}
              </li>
            ))}
          </ul>
          <ul className="space-y-2 text-sm">
            {desk.cases.map((item) => (
              <li key={item.id}>
                {item.type} · {item.employee.name} · {item.detail}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
