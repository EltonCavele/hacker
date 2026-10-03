"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FolhaLogo } from "@/features/folha/components/folha-logo";
import { signedKey } from "@/features/folha/offline";

export function SignMonth({
  cycleId,
  unitId,
  chiefName,
  present,
  leave,
  transit,
  unknown,
  drawsDone,
  drawsTotal,
}: {
  cycleId: string;
  unitId: string;
  chiefName: string;
  present: number;
  leave: number;
  transit: number;
  unknown: number;
  drawsDone: number;
  drawsTotal: number;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    setSigned(window.localStorage.getItem(signedKey(cycleId, unitId)) === "1");
    setReady(true);
  }, [cycleId, unitId]);

  function confirm() {
    window.localStorage.setItem(signedKey(cycleId, unitId), "1");
    setSigned(true);
    setOpen(false);
    router.push("/folha/chefe/fila");
  }

  if (!ready) return <div className="min-h-[70dvh]" />;

  if (signed) {
    return (
      <div className="px-5 pt-8">
        <div className="flex size-16 items-center justify-center rounded-3xl bg-primary text-primary-foreground">
          <FolhaLogo className="size-10" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          Atestação
          <br />
          assinada
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Guardada no aparelho, cifrada. Será enviada quando houver rede.</p>
        <div className="mt-6 rounded-2xl bg-card p-4 font-mono text-xs">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Cadeia de registos</p>
          <p className="mt-3">anterior 3bd7 91fe — 5d e1</p>
          <p>este 9f3a 0c44 — 7b c2</p>
          <p>chave Android Keystore · StrongBox</p>
        </div>
        <p className="mt-4 flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs text-background">
          <span className="size-2 rounded-full bg-primary" />
          Na fila · eventos assinados
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 pt-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Resumo · mês</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">
        Pronta para
        <br />
        assinar
      </h1>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {[
          [present, "Presentes"],
          [leave, "Licença"],
          [transit, "Em trânsito"],
          [unknown, "Não conheço"],
        ].map(([n, label]) => (
          <div className="rounded-2xl bg-muted p-4" key={String(label)}>
            <p className="text-2xl font-semibold">{n}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 rounded-full bg-primary/20 px-4 py-2 text-sm">
        {drawsDone} de {drawsTotal} sorteio fotografado
      </p>
      {unknown > 0 ? (
        <p className="mt-3 rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
          “Não conheço” abre verificação independente. Ninguém é cortado sem aviso.
        </p>
      ) : null}
      <Button className="mt-8 w-full" onClick={() => setOpen(true)} type="button">
        Assinar o mês
      </Button>
      {open ? (
        <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md">
          <button className="absolute inset-x-0 bottom-0 top-[-100vh] bg-foreground/20" onClick={() => setOpen(false)} type="button" />
          <div className="relative space-y-4 rounded-t-3xl bg-card p-6 pb-10 text-center shadow-lg">
            <p className="text-lg font-semibold">Confirme que é a {chiefName}</p>
            <p className="text-sm text-muted-foreground">A atestação é uma assinatura com responsabilidade pessoal.</p>
            <Button className="w-full bg-foreground text-background hover:bg-foreground/90" onClick={confirm} type="button">
              Usar impressão digital
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
