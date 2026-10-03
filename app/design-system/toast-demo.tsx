"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ToastDemo() {
  return (
    <>
      <Button variant="outline" onClick={() => toast.success("Alterações guardadas.")}>Sucesso</Button>
      <Button variant="outline" onClick={() => toast.error("Não foi possível guardar.")}>Erro</Button>
      <Button variant="outline" onClick={() => toast("Sessão iniciada", { description: "Bem-vindo de volta." })}>Neutro</Button>
    </>
  );
}
