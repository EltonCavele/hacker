"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FolhaLogo } from "@/features/folha/components/folha-logo";
import { unlockedKey } from "@/features/folha/offline";

function FingerprintIcon() {
  return (
    <svg aria-hidden className="size-12 text-primary" fill="none" viewBox="0 0 48 48">
      <path d="M24 10c-7.2 0-13 5.6-13 13.4 0 2.4.5 4.7 1.4 6.7" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
      <path d="M24 10c7.2 0 13 5.6 13 13.4 0 8.4-3.4 14-7.6 19.2" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
      <path d="M18.2 14.6C20 13.4 22 12.8 24 12.8c5.8 0 10.4 4.5 10.4 10.6 0 3.2-.8 6.2-2.2 8.8" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
      <path d="M16.4 19.2c-.8 1.5-1.2 3.2-1.2 5 0 5.6 2 10 5.2 14.4" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
      <path d="M24 18.4c-2.8 0-5 2.3-5 5.4 0 4.6 1.4 8 3.8 11.6" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
      <path d="M24 18.4c2.8 0 5 2.3 5 5.4 0 2.2-.4 4.2-1.2 6.2" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
      <path d="M24 23.6c0 3.4.6 6 2 9" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
    </svg>
  );
}

export function UnlockGate({
  children,
  unitName,
  unitMeta,
  queued = 0,
}: {
  children: React.ReactNode;
  unitName: string;
  unitMeta: string;
  queued?: number;
}) {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setOpen(sessionStorage.getItem(unlockedKey()) !== "1");
    setReady(true);
  }, []);

  if (!ready) {
    return <div className="min-h-[70dvh]" />;
  }

  if (open) {
    return (
      <div className="fixed inset-x-0 top-0 z-50 mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background px-6 pt-10">
        <div className="flex items-center gap-2">
          <FolhaLogo className="size-8 text-primary" />
          <span className="text-lg font-semibold tracking-tight">folha viva</span>
        </div>
        <div className="mt-16">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Unidade</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{unitName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{unitMeta}</p>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <Button
            aria-label="Toque para entrar"
            className="size-28 rounded-3xl bg-foreground text-background hover:bg-foreground/90"
            onClick={() => {
              sessionStorage.setItem(unlockedKey(), "1");
              setOpen(false);
            }}
            size="icon"
            type="button"
          >
            <FingerprintIcon />
          </Button>
          <div className="text-center">
            <p className="font-medium">Toque para entrar</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Só a chefe da unidade pode abrir. Sem palavra-passe para partilhar.
            </p>
          </div>
        </div>
        <p className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="size-2 rounded-full bg-primary" />
          Sem rede · a app funciona offline
          <span className="ml-auto">{queued} na fila</span>
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
