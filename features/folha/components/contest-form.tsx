"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { openContest } from "@/features/folha/actions";

export function ContestForm({ employeeId }: { employeeId: string }) {
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        start(async () => {
          const result = await openContest(employeeId, reason);
          if (result.error === "reason") toast.error("Escreve o motivo da contestação (pelo menos 8 caracteres).");
          else if (result.error) toast.error("Não foi possível abrir a contestação.");
          else {
            toast.success("Contestação registada na sede distrital.");
            setReason("");
          }
        });
      }}
    >
      <Label htmlFor="contest-reason">Motivo da contestação</Label>
      <Textarea id="contest-reason" name="reason" onChange={(event) => setReason(event.target.value)} required value={reason} />
      <Button disabled={pending} type="submit">
        Contestar na sede distrital
      </Button>
    </form>
  );
}
