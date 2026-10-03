import { redirect } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { ContestForm } from "@/features/folha/components/contest-form";
import { FolhaBadge } from "@/features/folha/components/folha-badge";
import { loginRedirectPath } from "@/features/auth/redirect-to-login";
import { getSession } from "@/features/auth/queries";
import { getActiveCycle, getEmployeeDesk } from "@/features/folha/queries";
import { getFolhaRole } from "@/features/folha/role";

export default async function FuncionarioPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const session = await getSession();
  if (!session) redirect(await loginRedirectPath("/folha/funcionario"));
  if ((await getFolhaRole()) !== "employee") redirect("/folha");
  const [{ id }, cycle] = await Promise.all([searchParams, getActiveCycle()]);
  if (!cycle) return <EmptyState title="Sem ciclo de folha" description="Corre o seed da Folha Viva." />;
  const desk = await getEmployeeDesk(cycle.id, id);
  if (!desk.current) return <EmptyState title="Sem funcionários" description="A sede distrital ainda não tem processos." />;

  return (
    <div className="space-y-8 px-5 pt-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Sede distrital</h1>
        <p className="mt-2 text-muted-foreground">O funcionário não precisa de telemóvel. A contestação faz-se aqui, sem cortar o salário sem aviso.</p>
      </div>
      <form className="flex max-w-md flex-col gap-2">
        <Label htmlFor="employee-id">Quem está na sede</Label>
        <NativeSelect className="w-full" defaultValue={desk.current.id} id="employee-id" name="id">
          {desk.employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
            </option>
          ))}
        </NativeSelect>
        <Button className="self-start" type="submit">
          Abrir processo
        </Button>
      </form>
      <Card>
        <CardHeader>
          <CardTitle>{desk.current.name}</CardTitle>
          <CardDescription>
            {desk.current.unit ? `${desk.current.unit.name} · ${desk.current.unit.district}` : "Sem unidade de trabalho"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <FolhaBadge value={desk.current.status} />
            {desk.attestation ? <FolhaBadge value={desk.attestation.mark} /> : null}
            {desk.payment ? <FolhaBadge value={desk.payment.decision} /> : null}
          </div>
          {desk.attestation?.warnedAt ? (
            <Alert variant="destructive">
              <AlertTitle>Aviso antes do corte</AlertTitle>
              <AlertDescription>O chefe marcou uma situação negativa. Podes contestar antes de qualquer suspensão definitiva.</AlertDescription>
            </Alert>
          ) : null}
          {desk.contest ? (
            <Alert>
              <AlertTitle>Contestação {desk.contest.status === "OPEN" ? "em análise" : desk.contest.status}</AlertTitle>
              <AlertDescription>{desk.contest.reason}</AlertDescription>
            </Alert>
          ) : (
            <ContestForm employeeId={desk.current.id} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
