"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { recordAudit } from "@/features/folha/actions";

export function AuditButtons({ unitId, employeeId }: { unitId: string; employeeId: string }) {
  const [pending, start] = useTransition();

  function record(foundPresent: boolean) {
    start(async () => {
      const result = await recordAudit({ unitId, employeeId, foundPresent });
      if (result.error) toast.error("Não foi possível guardar a visita.");
      else toast.success(foundPresent ? "Encontrado no posto." : "Não encontrado.");
    });
  }

  return (
    <div className="flex gap-2">
      <Button disabled={pending} onClick={() => record(true)} size="sm" type="button">
        Encontrei
      </Button>
      <Button disabled={pending} onClick={() => record(false)} size="sm" type="button" variant="outline">
        Não está
      </Button>
    </div>
  );
}
