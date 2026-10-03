"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { List, ListIcon, ListItem, ListItemDescription, ListItemEnd, ListItemStart, ListItemTitle } from "@/components/ui/list";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { saveAttestation } from "@/features/folha/actions";
import { FolhaLogo, initials } from "@/features/folha/components/folha-logo";
import { FolhaBadge } from "@/features/folha/components/folha-badge";
import { MARK_OPTIONS, monthLabel, queueKey, type QueueItem } from "@/features/folha/offline";

function ProgressRing({ done, total }: { done: number; total: number }) {
  const r = 28;
  const c = 2 * Math.PI * r;
  const pct = total === 0 ? 0 : done / total;
  return (
    <svg aria-hidden className="size-20 -rotate-90" viewBox="0 0 72 72">
      <circle className="stroke-muted" cx="36" cy="36" fill="none" r={r} strokeWidth="6" />
      <circle
        className="stroke-primary"
        cx="36"
        cy="36"
        fill="none"
        r={r}
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        strokeLinecap="round"
        strokeWidth="6"
      />
    </svg>
  );
}

function markLabel(mark: string) {
  return MARK_OPTIONS.find((option) => option.value === mark)?.label ?? mark;
}

export function AttestationRoster({
  cycleId,
  yearMonth,
  remainingDays,
  unit,
  employees,
  attestations,
  draws,
  chiefName,
}: {
  cycleId: string;
  yearMonth: string;
  remainingDays: number;
  unit: { id: string; name: string; offlineZone: boolean; deviceWiped: boolean };
  employees: Array<{ id: string; name: string; status: string; nuit: string }>;
  attestations: Record<string, { mark: string; justification: string | null; createdOffline: boolean }>;
  draws: Array<{ id: string; employeeId: string; employeeName: string; photoResult: string | null }>;
  chiefName: string;
}) {
  const router = useRouter();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [pending, start] = useTransition();
  const [selected, setSelected] = useState<(typeof employees)[number] | null>(null);
  const offline = unit.offlineZone;

  useEffect(() => {
    const raw = window.localStorage.getItem(queueKey(cycleId, unit.id));
    if (raw) setQueue(JSON.parse(raw) as QueueItem[]);
  }, [cycleId, unit.id]);

  function persistQueue(next: QueueItem[]) {
    setQueue(next);
    window.localStorage.setItem(queueKey(cycleId, unit.id), JSON.stringify(next));
  }

  function markFor(employeeId: string) {
    return queue.find((item) => item.employeeId === employeeId)?.mark ?? attestations[employeeId]?.mark ?? "";
  }

  function saveMark(employeeId: string, mark: string) {
    if (!mark) return;
    if (offline) {
      persistQueue([...queue.filter((item) => item.employeeId !== employeeId), { unitId: unit.id, employeeId, mark }]);
      toast.message("Guardado sem rede. Sincroniza quando houver sinal.");
      setSelected(null);
      return;
    }
    start(async () => {
      const result = await saveAttestation({ unitId: unit.id, employeeId, mark });
      if (result.error) toast.error("Não foi possível guardar a atestação.");
      else toast.success("Marcação assinada.");
      setSelected(null);
    });
  }

  const marked = employees.filter((employee) => markFor(employee.id)).length;
  const remaining = employees.length - marked;
  const pendingDraws = draws.filter((draw) => !draw.photoResult).length;

  return (
    <div className="px-5 pt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolhaLogo className="size-7 text-primary" />
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{unit.name}</p>
        </div>
        <Avatar size="sm">
          <AvatarFallback>{initials(chiefName)}</AvatarFallback>
        </Avatar>
      </div>

      <p className="mt-6 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{monthLabel(yearMonth)}</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">
        Atestação
        <br />
        mensal
      </h1>

      <div className="mt-5 flex items-center gap-4 rounded-3xl bg-card p-4 shadow-sm">
        <div className="relative">
          <ProgressRing done={marked} total={employees.length} />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-lg font-semibold leading-none">{marked}</span>
            <span className="text-[10px] text-muted-foreground">de {employees.length}</span>
          </div>
        </div>
        <div className="flex-1">
          <p className="font-medium">{remaining} por marcar</p>
          <p className="text-sm text-muted-foreground">Prazo até dia 10. Faltam {remainingDays} dias.</p>
          <Button className="mt-3" onClick={() => router.push("/folha/chefe/assinar")} size="sm" type="button">
            Continuar
          </Button>
        </div>
      </div>

      {draws.length > 0 ? (
        <Link
          className="mt-4 block rounded-3xl bg-foreground p-4 text-background"
          href="/folha/chefe/sorteio"
        >
          <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.14em] text-primary">
            <span>Sorteio do mês</span>
            <span>{draws.length} pessoa{draws.length === 1 ? "" : "s"}</span>
          </div>
          <p className="mt-2 text-lg font-semibold">Fotografar no posto até 10</p>
          <p className="mt-1 text-sm text-background/70">
            {pendingDraws === 0 ? "Todas as fotos já foram feitas." : `${pendingDraws} ainda por fotografar.`}
          </p>
        </Link>
      ) : null}

      <p className="mt-6 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Equipa</p>
      <List>
        {employees.map((employee) => {
          const mark = markFor(employee.id);
          return (
            <ListItem className="cursor-pointer border-b border-border last:border-0" key={employee.id} onClick={() => setSelected(employee)}>
              <ListIcon>
                <Avatar>
                  <AvatarFallback className="bg-secondary text-foreground">{initials(employee.name)}</AvatarFallback>
                </Avatar>
              </ListIcon>
              <ListItemStart>
                <ListItemTitle>{employee.name}</ListItemTitle>
                <ListItemDescription>
                  {employee.status === "ACTIVE" ? "Na unidade" : <FolhaBadge value={employee.status} />}
                </ListItemDescription>
              </ListItemStart>
              <ListItemEnd>
                {mark ? (
                  <Badge variant={mark === "PRESENT" ? "success" : mark === "UNKNOWN" ? "warning" : "secondary"}>{markLabel(mark)}</Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">Por marcar</span>
                )}
              </ListItemEnd>
            </ListItem>
          );
        })}
      </List>

      {selected ? (
        <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md">
          <button className="absolute inset-x-0 bottom-0 top-[-100vh] bg-foreground/20" onClick={() => setSelected(null)} type="button" />
          <div className="relative rounded-t-3xl bg-card p-5 pb-8 shadow-lg">
            <p className="text-lg font-semibold">{selected.name}</p>
            <p className="text-sm text-muted-foreground">NUIT {selected.nuit} · cada marcação é assinada.</p>
            <RadioGroup
              className="mt-4"
              disabled={pending}
              onValueChange={(value) => saveMark(selected.id, value)}
              value={markFor(selected.id) || undefined}
            >
              {MARK_OPTIONS.map((option) => (
                <div className="flex items-center gap-3 rounded-full px-3 py-2 has-data-checked:bg-primary has-data-checked:text-primary-foreground" key={option.value}>
                  <RadioGroupItem id={`mark-${option.value}`} value={option.value} />
                  <Label className="flex-1 py-1" htmlFor={`mark-${option.value}`}>
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function DrawList({
  draws,
}: {
  draws: Array<{ id: string; employeeName: string; photoResult: string | null; role?: string }>;
}) {
  return (
    <div className="px-5 pt-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Sorteio · outubro</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">
        {draws.length} {draws.length === 1 ? "pessoa" : "pessoas"}
        <br />
        sorteadas
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">Fotografe cada uma no posto de trabalho até dia 10.</p>
      <List className="mt-6">
        {draws.map((draw) => (
          <ListItem className="cursor-default rounded-2xl bg-card px-3 hover:text-foreground" key={draw.id}>
            <ListIcon>
              <Avatar>
                <AvatarFallback>{initials(draw.employeeName)}</AvatarFallback>
              </Avatar>
            </ListIcon>
            <ListItemStart>
              <ListItemTitle>{draw.employeeName}</ListItemTitle>
              <ListItemDescription>{draw.role ?? "Na unidade"}</ListItemDescription>
            </ListItemStart>
            <ListItemEnd>
              {draw.photoResult === "MATCH" ? (
                <Badge variant="success">Feito</Badge>
              ) : draw.photoResult ? (
                <FolhaBadge value={draw.photoResult} />
              ) : (
                <Button asChild size="sm">
                  <Link href={`/folha/chefe/sorteio/${draw.id}`}>Fotografar</Link>
                </Button>
              )}
            </ListItemEnd>
          </ListItem>
        ))}
      </List>
      <div className="mt-6 rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em]">Porque estas pessoas?</p>
        <p className="mt-2">HMAC-SHA256(semente, unidade ‖ mês ‖ NUIT). A semente é comprometida antes e revelada depois.</p>
      </div>
    </div>
  );
}
