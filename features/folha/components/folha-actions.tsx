"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  acceptAdmission,
  acceptTransfer,
  openCase,
  resolveContest,
  sendNegativeMarkWarning,
} from "@/features/folha/actions";

export function FolhaActionButton({
  label,
  run,
  variant = "secondary",
}: {
  label: string;
  run: () => Promise<{ error: string | null } | { error: string } | { error: null }>;
  variant?: "secondary" | "destructive" | "outline" | "default";
}) {
  const [pending, start] = useTransition();
  return (
    <Button
      disabled={pending}
      onClick={() =>
        start(async () => {
          const result = await run();
          if (result?.error) toast.error("A acção não foi aceite.");
          else toast.success(label);
        })
      }
      size="sm"
      type="button"
      variant={variant}
    >
      {label}
    </Button>
  );
}

export function WarnButton({ attestationId }: { attestationId: string }) {
  return <FolhaActionButton label="Avisar o funcionário" run={() => sendNegativeMarkWarning(attestationId)} />;
}

export function AcceptAdmissionButton({ employeeId }: { employeeId: string }) {
  return <FolhaActionButton label="Aceitar admissão" run={() => acceptAdmission(employeeId)} />;
}

export function AcceptTransferButton({ movementId }: { movementId: string }) {
  return <FolhaActionButton label="Confirmar recepção" run={() => acceptTransfer(movementId)} />;
}

export function ResolveContestButtons({ contestId }: { contestId: string }) {
  return (
    <div className="flex gap-2">
      <FolhaActionButton label="Genuíno, reactivar" run={() => resolveContest(contestId, true)} variant="default" />
      <FolhaActionButton label="Confirmar fantasma" run={() => resolveContest(contestId, false)} variant="destructive" />
    </div>
  );
}

export function OpenCaseButton({ employeeId, detail }: { employeeId: string; detail: string }) {
  return <FolhaActionButton label="Abrir processo" run={() => openCase(employeeId, detail)} variant="outline" />;
}
