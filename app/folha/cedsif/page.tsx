import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { directionUnitsFrom, summarizeDirections } from "@/features/folha/directions";
import { formatMzn } from "@/features/folha/panel";
import { getCedsifGate } from "@/features/folha/queries";

export default async function CedsifPage() {
  const view = await getCedsifGate();
  if (!view) {
    return (
      <>
        <PageHeader title="CEDSIF" />
        <div className="px-6 pb-16 pt-6">
          <EmptyState title="Sem ciclo de folha" description="Corre o seed da Folha Viva." />
        </div>
      </>
    );
  }

  const { cycle, gate, desk } = view;
  const releasedIds = new Set(gate.lines.filter((line) => line.released).map((line) => line.employeeId));
  const validatedAt = new Intl.DateTimeFormat("pt", { dateStyle: "medium", timeStyle: "short" }).format(gate.validatedAt);
  const directions = summarizeDirections(
    directionUnitsFrom(desk.units),
    desk.payroll.map((row) => ({
      unitId: row.employee.unitId,
      salaryMzn: row.employee.salaryMzn,
      released: releasedIds.has(row.employee.id),
    })),
  );

  const steps = [
    {
      step: "1",
      title: "e-folha",
      value: `${gate.lineCount} salários`,
      detail: `Disponibilizou a folha de ${cycle.yearMonth}.`,
    },
    {
      step: "2",
      title: "Trigger",
      value: `${gate.lineCount} conferidos`,
      detail: `Cada salário, a ${validatedAt}.`,
    },
    {
      step: "3",
      title: "CEDSIF",
      value: `${gate.releasedCount} seguem`,
      detail: `${gate.heldCount} ficam de fora deste pagamento.`,
    },
  ];

  return (
    <>
      <PageHeader title="CEDSIF" />
      <div className="flex flex-col gap-8 px-6 pb-16 pt-6">
        <section className="space-y-5">
          <div className="space-y-2">
            <h2 className="text-lg font-medium">Como a folha chega ao pagamento</h2>
            <p className="max-w-2xl leading-7 text-muted-foreground">
              A e-folha manda a folha. O trigger confere cada salário. O CEDSIF só paga quem passou.
            </p>
          </div>
          <ol className="grid gap-3 md:grid-cols-3">
            {steps.map((item) => (
              <li key={item.step}>
                <Card className="h-full border">
                  <CardHeader>
                    <CardDescription>Passo {item.step}</CardDescription>
                    <CardTitle>{item.title}</CardTitle>
                    <p className="text-2xl font-medium tabular-nums">{item.value}</p>
                    <p className="text-muted-foreground">{item.detail}</p>
                  </CardHeader>
                </Card>
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-5 border-t pt-6">
          <div className="space-y-1">
            <h2 className="text-lg font-medium">Direcções</h2>
            <p className="max-w-2xl text-muted-foreground">
              Abre uma direcção para ver quem segue para pagamento e quem fica de fora.
            </p>
          </div>
          {directions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma direcção nesta folha.</p>
          ) : (
            <Table aria-label="Direcções desta folha">
              <TableHeader>
                <TableRow>
                  <TableHead>Direcção</TableHead>
                  <TableHead mobileHidden>Município</TableHead>
                  <TableHead mobileHidden>Província</TableHead>
                  <TableHead className="text-right">Seguem</TableHead>
                  <TableHead className="text-right">De fora</TableHead>
                  <TableHead className="text-right">A pagar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {directions.map((direction) => (
                  <TableRow className="relative" key={direction.id}>
                    <TableCell className="font-medium">
                      <Link className="after:absolute after:inset-0" href={`/folha/cedsif/${direction.id}`}>
                        {direction.name}
                      </Link>
                    </TableCell>
                    <TableCell mobileHidden>{direction.district ?? "—"}</TableCell>
                    <TableCell mobileHidden>{direction.province ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{direction.releasedCount}</TableCell>
                    <TableCell className="text-right tabular-nums">{direction.heldCount}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMzn(direction.releasedAmount)}</TableCell>
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
