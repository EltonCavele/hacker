import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { List, ListItem, ListItemDescription, ListItemEnd, ListItemStart, ListItemTitle } from "@/components/ui/list";
import { getPublicPanel } from "@/features/folha/queries";

export default async function PainelPage() {
  const panel = await getPublicPanel();
  if (!panel.cycle) {
    return <EmptyState title="Painel ainda sem dados" description="Quando o ciclo mensal existir, os distritos aparecem aqui." />;
  }

  return (
    <div className="space-y-8 px-5 pt-6">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Raiz Merkle · dados fictícios</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Painel público</h1>
        <p className="mt-2 text-muted-foreground">Ciclo {panel.cycle.yearMonth}. Números por distrito, sem meta de processos.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Indicadores</CardTitle>
          <CardDescription>Folha com dono, verificada, atestação no prazo e discrepâncias.</CardDescription>
        </CardHeader>
        <CardContent>
          <List>
            {panel.districts.map((row) => (
              <ListItem className="cursor-default border-b border-border last:border-0" key={row.district}>
                <ListItemStart>
                  <ListItemTitle>{row.district}</ListItemTitle>
                  <ListItemDescription>
                    {row.staff} salários · {row.unitCount} unidades · atestação {row.attestedOnTime}%
                  </ListItemDescription>
                </ListItemStart>
                <ListItemEnd>
                  <span className="text-sm font-medium">{row.owned}% dono</span>
                  <span className="text-xs text-muted-foreground">{row.verified}% verificada · {row.discrepancies} discrep.</span>
                </ListItemEnd>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </div>
  );
}
