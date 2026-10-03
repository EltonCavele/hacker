"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "reicon-react";
import { Button } from "@/components/ui/button";
import { recordDrawPhoto } from "@/features/folha/actions";
import { initials } from "@/features/folha/components/folha-logo";

export function PhotoCapture({
  drawId,
  name,
}: {
  drawId: string;
  name: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"live" | "compare">("live");
  const [pending, start] = useTransition();

  if (step === "live") {
    return (
      <div className="flex min-h-[85dvh] flex-col bg-foreground px-5 py-4 text-background">
        <div className="flex items-center justify-between text-xs">
          <span className="rounded-full bg-primary px-3 py-1 text-primary-foreground">Dentro da unidade · 34 m</span>
          <span className="rounded-full bg-background/15 px-3 py-1">07 Out · 08:43</span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="relative size-64">
            <div className="absolute inset-6 rounded-full bg-background/10" />
            <div className="absolute inset-0 rounded-full border-2 border-primary/40" />
            <div className="absolute inset-0 rounded-full border-t-2 border-primary" />
          </div>
          <p className="mt-8 text-xl font-semibold">Pisque os olhos</p>
          <p className="mt-1 text-sm text-background/70">Verificação de vivacidade 2/3</p>
        </div>
        <div className="flex items-center justify-between pb-6">
          <p className="text-sm">{name}</p>
          <Button
            aria-label="Capturar foto"
            className="size-16 rounded-full border-4 border-background bg-transparent"
            onClick={() => setStep("compare")}
            size="icon"
            type="button"
            variant="outline"
          />
          <p className="text-sm">3 de 3</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[85dvh] flex-col px-5 pt-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Verificação no posto</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">{name}</h1>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="flex aspect-square flex-col items-center justify-center rounded-3xl bg-foreground text-primary">
          <span className="text-4xl font-semibold">{initials(name)}</span>
          <span className="mt-2 text-xs text-background/70">Agora</span>
        </div>
        <div className="flex aspect-square flex-col items-center justify-center rounded-3xl bg-muted">
          <span className="text-4xl font-semibold text-muted-foreground">{initials(name)}</span>
          <span className="mt-2 text-xs text-muted-foreground">BioPV</span>
        </div>
      </div>
      <ul className="mt-6 space-y-3 text-sm">
        {[
          ["Rosto coincide", "0,94 ≥ 0,80"],
          ["Pessoa real, não foto", "vivacidade"],
          ["Dentro da unidade", "34 m"],
          ["Em horário de trabalho", "08:43"],
        ].map(([label, value]) => (
          <li className="flex items-center gap-2" key={label}>
            <CheckCircle className="size-5 text-primary" />
            <span className="flex-1">{label}</span>
            <span className="text-muted-foreground">{value}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 font-mono text-[11px] text-muted-foreground">evidência assinada · Ed25519 · 7c9e 2a4f 0081 — b3e6 41ab</p>
      <Button
        className="mt-auto mb-6 w-full"
        isLoading={pending}
        onClick={() =>
          start(async () => {
            await recordDrawPhoto(drawId, "MATCH");
            router.push("/folha/chefe/sorteio");
          })
        }
        type="button"
      >
        Guardar e continuar
      </Button>
    </div>
  );
}
