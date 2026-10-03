"use client";

import { useState } from "react";
import { Button, type ButtonStatus } from "@/components/ui/button";

/** Simulates an async submit: loading → success/error → callback fires after the animation. */
function AnimatedDemo({ outcome, variant, label }: { outcome: "success" | "error"; variant?: "default" | "secondary" | "destructive"; label: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<ButtonStatus>("idle");
  const [done, setDone] = useState(false);

  function submit() {
    setDone(false);
    setIsLoading(true);
    window.setTimeout(() => {
      setIsLoading(false);
      setStatus(outcome);
    }, 1200);
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <Button
        isAnimated
        isLoading={isLoading}
        status={status}
        variant={variant}
        onClick={submit}
        onSuccess={() => { setStatus("idle"); setDone(true); }}
        onError={() => { setStatus("idle"); setDone(true); }}
      >
        {label}
      </Button>
      <span className="text-xs text-muted-foreground">{done ? `${outcome === "success" ? "onSuccess" : "onError"} chamado` : " "}</span>
    </div>
  );
}

/** A disabled button swallows the click and shakes; its onClick must never run. */
function DisabledDemo() {
  const [ran, setRan] = useState(0);
  return (
    <div className="flex flex-col items-start gap-1.5">
      <Button disabled onClick={() => setRan((n) => n + 1)}>
        Desabilitado
      </Button>
      <span className="text-xs text-muted-foreground">Clica: treme e não executa (onClick: {ran}×)</span>
    </div>
  );
}

/** A button that morphs into a field. The submit is async; the name "erro" is rejected to show the invalid state. */
function MorphDemo() {
  const [projects, setProjects] = useState<string[]>([]);
  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          input={{
            placeholder: "Nome do projecto",
            submitLabel: "Criar projecto",
            width: "17rem",
            onSubmit: async (name) => {
              await new Promise((resolve) => setTimeout(resolve, 900));
              if (name.toLowerCase() === "erro") throw new Error("nome inválido");
              setProjects((current) => [name, ...current]);
            },
          }}
        >
          Novo projecto
        </Button>
        <Button
          variant="outline"
          input={{ placeholder: "Escreve um comentário…", width: "20rem", onSubmit: (text) => setProjects((current) => [`💬 ${text}`, ...current]) }}
        >
          Comentar
        </Button>
      </div>
      <span className="text-xs text-muted-foreground">
        {projects.length ? projects.join(" · ") : 'Clica, escreve e prime Enter (Esc cancela; "erro" é rejeitado)'}
      </span>
    </div>
  );
}

export function ButtonDemo() {
  return (
    <>
      <MorphDemo />
      <DisabledDemo />
      <AnimatedDemo outcome="success" label="Guardar (sucesso)" />
      <AnimatedDemo outcome="error" variant="secondary" label="Guardar (erro)" />
    </>
  );
}
