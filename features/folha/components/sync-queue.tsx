"use client";

import { useEffect, useState, useTransition } from "react";
import { CheckCircle } from "reicon-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { syncOfflineAttestations } from "@/features/folha/actions";
import { queueKey, signedKey, type QueueItem } from "@/features/folha/offline";

export function SyncQueue({
  cycleId,
  unitId,
  yearMonth,
  staffCount,
  draws,
  chiefName,
}: {
  cycleId: string;
  unitId: string;
  yearMonth: string;
  staffCount: number;
  draws: Array<{ employeeName: string; photoResult: string | null }>;
  chiefName: string;
}) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [signed, setSigned] = useState(false);
  const [offline, setOffline] = useState(false);
  const [synced, setSynced] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => {
    const raw = window.localStorage.getItem(queueKey(cycleId, unitId));
    if (raw) setQueue(JSON.parse(raw) as QueueItem[]);
    setSigned(window.localStorage.getItem(signedKey(cycleId, unitId)) === "1");
  }, [cycleId, unitId]);

  const events = [
    `ATESTACAO ${yearMonth} ${staffCount} linhas`,
    ...draws.filter((draw) => draw.photoResult).map((draw) => `FOTO_POSTO ${draw.employeeName}`),
    ...(signed ? [`ASSINATURA ${chiefName} Ed25519`] : []),
    ...queue.map((item) => `FILA ${item.employeeId.slice(0, 8)} ${item.mark}`),
  ];

  function sync() {
    start(async () => {
      if (queue.length) await syncOfflineAttestations(queue);
      window.localStorage.setItem(queueKey(cycleId, unitId), "[]");
      setQueue([]);
      setSynced(true);
      setOffline(false);
    });
  }

  return (
    <div className="px-5 pt-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Fila · sincronização</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">{synced ? "Sincronizado" : "Na fila"}</h1>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Switch checked={offline} id="folha-offline" onCheckedChange={setOffline} />
          <Label htmlFor="folha-offline">Simular sem rede</Label>
        </div>
        <Button disabled={offline || pending} onClick={sync} size="sm" type="button">
          Enviar
        </Button>
      </div>
      <div className="mt-6 rounded-3xl bg-foreground p-4 text-background">
        <div className="flex items-center justify-between">
          <p className="font-medium">{events.length} eventos {synced ? "enviados" : "à espera"}</p>
          {synced ? <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">mTLS</span> : null}
        </div>
        <p className="mt-2 text-xs text-background/70">
          {synced ? "recebido pelo e-SNGRHE · recibo assinado pelo servidor" : "cifrado no aparelho até haver 2G"}
        </p>
      </div>
      <ul className="mt-4 space-y-3">
        {events.map((event) => (
          <li className="flex items-center gap-2 text-sm" key={event}>
            <CheckCircle className="size-5 text-primary" />
            {event}
          </li>
        ))}
      </ul>
    </div>
  );
}
