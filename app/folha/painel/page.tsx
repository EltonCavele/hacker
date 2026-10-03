import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getPublicPanel } from "@/features/folha/queries";

export default async function PainelPage() {
  const panel = await getPublicPanel();
  if (!panel.cycle) {
    return (
      <>
        <PageHeader title="Painel" />
        <div className="px-6 pb-16 pt-6">
          <EmptyState title="Painel ainda sem dados" description="Quando o ciclo mensal existir, os distritos aparecem aqui." />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Painel" />
      <div className="flex flex-col gap-8 px-6 pb-16 pt-6">
        <section className="space-y-2">
          <h2 className="text-lg font-medium">Ciclo {panel.cycle.yearMonth}</h2>
          <p className="max-w-2xl leading-7 text-muted-foreground">
            Números por distrito, sem meta de processos. Dados fictícios.
          </p>
        </section>
        <section className="space-y-5 border-t pt-6">
          <div className="space-y-1">
            <h2 className="text-lg font-medium">Distritos</h2>
            <p className="text-muted-foreground">Folha com dono, verificada, atestação no prazo e discrepâncias.</p>
          </div>
          <ul className="divide-y divide-border">
            {panel.districts.map((row) => (
              <li className="flex flex-wrap items-center justify-between gap-4 py-4" key={row.district}>
                <div>
                  <p className="font-medium">{row.district}</p>
                  <p className="text-sm text-muted-foreground">
                    {row.staff} salários · {row.unitCount} unidades
                  </p>
                </div>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
                  <div>
                    <dt className="text-muted-foreground">Com dono</dt>
                    <dd className="font-medium">{row.owned}%</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Verificada</dt>
                    <dd className="font-medium">{row.verified}%</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Atestação</dt>
                    <dd className="font-medium">{row.attestedOnTime}%</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Discrepâncias</dt>
                    <dd className="font-medium">{row.discrepancies}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
