import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AcceptAdmissionButton, OpenCaseButton, WarnButton } from "@/features/folha/components/folha-actions";
import { FolhaBadge } from "@/features/folha/components/folha-badge";
import { directionIdFor, directionUnitsFrom, summarizeDirections } from "@/features/folha/directions";
import { formatMzn } from "@/features/folha/panel";
import { getCedsifGate } from "@/features/folha/queries";
import { isNegativeMark } from "@/features/folha/types";

export default async function CedsifDirectionPage({ params }: { params: Promise<{ unitId: string }> }) {
  const { unitId } = await params;
  const view = await getCedsifGate();
  if (!view) {
    return (
      <>
        <PageHeader back={{ href: "/folha/cedsif", label: "CEDSIF" }} title="CEDSIF" />
        <div className="px-6 pb-16 pt-6">
          <EmptyState title="Sem ciclo de folha" description="Corre o seed da Folha Viva." />
        </div>
      </>
    );
  }

  const { gate, desk } = view;
  const releasedIds = new Set(gate.lines.filter((line) => line.released).map((line) => line.employeeId));
  const units = directionUnitsFrom(desk.units);
  const direction = summarizeDirections(
    units,
    desk.payroll.map((row) => ({
      unitId: row.employee.unitId,
      salaryMzn: row.employee.salaryMzn,
      released: releasedIds.has(row.employee.id),
    })),
  ).find((item) => item.id === unitId);

  if (!direction) {
    return (
      <>
        <PageHeader back={{ href: "/folha/cedsif", label: "CEDSIF" }} title="CEDSIF" />
        <div className="px-6 pb-16 pt-6">
          <EmptyState title="Direcção não encontrada" description="Esta direcção não entra na folha deste ciclo." />
        </div>
      </>
    );
  }

  const unitById = new Map(units.map((unit) => [unit.id, unit]));
  const memberIds = new Set(direction.unitIds);
  const rows = desk.payroll.filter((row) => directionIdFor(row.employee.unitId, unitById) === direction.id);
  const paying = rows.filter((row) => releasedIds.has(row.employee.id));
  const held = rows.filter((row) => !releasedIds.has(row.employee.id));
  const awaitingChief = paying.filter((row) => row.payment.reason === "chiefDidNotAttest").length;
  const unclaimedIds = new Set(desk.unclaimed.map((row) => row.employee.id));
  const openCases = new Set(desk.cases.map((item) => item.employeeId));
  const included = units.filter((unit) => memberIds.has(unit.id) && unit.id !== direction.id).map((unit) => unit.name);
  const byUnit = new Map<string, typeof paying>();
  for (const row of paying) {
    const name = row.employee.unit?.name ?? "Sem unidade";
    const list = byUnit.get(name) ?? [];
    list.push(row);
    byUnit.set(name, list);
  }
  const place = direction.district ? `${direction.district}, ${direction.province}` : "Sem posto atribuído";

  return (
    <>
      <PageHeader back={{ href: "/folha/cedsif", label: "CEDSIF" }} title={direction.name} />
      <div className="flex flex-col gap-8 px-6 pb-16 pt-6">
        <section className="space-y-5">
          <div className="space-y-2">
            <h2 className="text-lg font-medium">{place}</h2>
            <p className="max-w-2xl leading-7 text-muted-foreground">
              {direction.chiefName ? `Chefe ${direction.chiefName}.` : "Sem chefe nomeado."}
              {included.length > 0 ? ` Inclui ${included.join(", ")}.` : ""}
              {awaitingChief > 0 ? ` ${awaitingChief} ainda sem atestação do chefe: a regra deixa-os seguir na mesma.` : ""}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-3">
            <Card className="border">
              <CardHeader>
                <CardDescription>Segue para pagamento</CardDescription>
                <CardTitle className="text-2xl tabular-nums">{paying.length}</CardTitle>
                <p className="text-muted-foreground">{formatMzn(direction.releasedAmount)}</p>
              </CardHeader>
            </Card>
            <Card className="border">
              <CardHeader>
                <CardDescription>Fica de fora</CardDescription>
                <CardTitle className="text-2xl tabular-nums">{held.length}</CardTitle>
                <p className="text-muted-foreground">{formatMzn(direction.heldAmount)}</p>
              </CardHeader>
            </Card>
          </dl>
        </section>

        <Tabs defaultValue="paying">
          <TabsList className="w-full">
            <TabsTrigger value="paying">Segue para pagamento</TabsTrigger>
            <TabsTrigger value="held">Fica de fora</TabsTrigger>
          </TabsList>
          <TabsContent className="text-base" value="paying">
            <p className="py-4 text-muted-foreground">O CEDSIF pode processar estes salários.</p>
            {paying.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ninguém desta direcção segue neste ciclo.</p>
            ) : (
              <div className="space-y-6">
                {[...byUnit.entries()]
                  .sort(([left], [right]) => left.localeCompare(right, "pt"))
                  .map(([unit, people]) => (
                    <div key={unit}>
                      {byUnit.size > 1 ? <h3 className="font-medium">{unit}</h3> : null}
                      <ul className="divide-y divide-border">
                        {people.map((row) => (
                          <li className="flex flex-wrap items-center justify-between gap-3 py-3" key={row.employee.id}>
                            <p className="font-medium">{row.employee.name}</p>
                            <div className="flex flex-wrap items-center gap-2">
                              {row.payment.reason === "clean" || row.payment.reason === "chiefDidNotAttest" ? null : (
                                <FolhaBadge value={row.payment.reason} />
                              )}
                              <span className="text-sm tabular-nums text-muted-foreground">{formatMzn(row.employee.salaryMzn)}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>
          <TabsContent className="text-base" value="held">
            <p className="py-4 text-muted-foreground">Não saem neste ciclo.</p>
            {held.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ninguém ficou retido.</p>
            ) : (
              <ul className="divide-y divide-border">
                {held.map((row) => {
                  const highRisk = row.anomalies.find((alert) => alert.risk === "HIGH");
                  return (
                    <li className="flex flex-wrap items-center justify-between gap-3 py-3" key={row.employee.id}>
                      <div className="min-w-0">
                        <p className="font-medium">{row.employee.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {row.employee.unit?.name ?? "Sem unidade"}
                          {unclaimedIds.has(row.employee.id) ? " · há mais de 60 dias" : ""} · {formatMzn(row.employee.salaryMzn)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <FolhaBadge value={row.payment.reason} />
                        {row.employee.status === "ADMISSION_PENDING" ? <AcceptAdmissionButton employeeId={row.employee.id} /> : null}
                        {row.attestation && isNegativeMark(row.attestation.mark) && !row.attestation.warnedAt ? (
                          <WarnButton attestationId={row.attestation.id} />
                        ) : null}
                        {highRisk && !openCases.has(row.employee.id) ? (
                          <OpenCaseButton detail={highRisk.detail} employeeId={row.employee.id} />
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
