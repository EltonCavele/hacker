import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ScrollLandmark } from "@/components/ui/scroll-landmark";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PanelCharts } from "@/features/folha/components/panel-charts";
import { formatMzn } from "@/features/folha/panel";
import { getPublicPanel } from "@/features/folha/queries";

export default async function PainelPage() {
  const panel = await getPublicPanel();
  if (!panel.cycle || panel.stats.units.length === 0) {
    return (
      <>
        <PageHeader title="Painel" />
        <div className="px-6 pb-16 pt-6">
          <EmptyState
            title="Painel ainda sem dados"
            description="Quando o ciclo mensal existir, as unidades de cada município aparecem aqui."
          />
        </div>
      </>
    );
  }

  const { totals } = panel.stats;
  const figures = [
    { label: "Municípios", value: String(totals.municipalities) },
    { label: "Unidades", value: String(totals.units) },
    { label: "Salários", value: String(totals.staff) },
    { label: "Massa salarial", value: formatMzn(totals.payrollMzn) },
  ];

  return (
    <>
      <PageHeader title="Painel" />
      <div className="flex flex-col gap-8 px-6 pb-16 pt-6">
        <section className="space-y-2">
          <h2 className="text-lg font-medium">Ciclo {panel.cycle.yearMonth}</h2>
          <p className="max-w-2xl leading-7 text-muted-foreground">
            Estatísticas de todas as unidades do Estado, agrupadas por município. Dados fictícios.
          </p>
        </section>

        <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {figures.map((figure) => (
            <Card className="border" key={figure.label}>
              <CardHeader>
                <CardDescription>{figure.label}</CardDescription>
                <CardTitle className="text-2xl tabular-nums">{figure.value}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </dl>

        <PanelCharts stats={panel.stats} />

        <section className="space-y-5 border-t pt-6">
          <div className="space-y-1">
            <h2 className="text-lg font-medium">Municípios</h2>
            <p className="text-muted-foreground">Os mesmos números dos gráficos, em tabela.</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Município</TableHead>
                <TableHead mobileHidden>Província</TableHead>
                <TableHead className="text-right">Unidades</TableHead>
                <TableHead className="text-right">Salários</TableHead>
                <TableHead className="text-right" mobileHidden>
                  Massa
                </TableHead>
                <TableHead className="text-right" mobileHidden>
                  Com chefe
                </TableHead>
                <TableHead className="text-right">Verificada</TableHead>
                <TableHead className="text-right" mobileHidden>
                  Atestação
                </TableHead>
                <TableHead className="text-right">Discrepâncias</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {panel.stats.municipalities.map((row) => (
                <TableRow key={row.municipality}>
                  <TableCell className="font-medium">{row.municipality}</TableCell>
                  <TableCell mobileHidden>{row.province}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.unitCount}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.staff}</TableCell>
                  <TableCell className="text-right tabular-nums" mobileHidden>
                    {formatMzn(row.payrollMzn)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums" mobileHidden>
                    {row.owned}%
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.verified}%</TableCell>
                  <TableCell className="text-right tabular-nums" mobileHidden>
                    {row.attestedOnTime}%
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.discrepancies}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      </div>
      <ScrollLandmark />
    </>
  );
}
