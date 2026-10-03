import { Badge } from "@/components/ui/badge";

const marks: Record<string, { label: string; variant: "success" | "warning" | "danger" | "muted" | "info" | "secondary" }> = {
  PRESENT: { label: "Presente", variant: "success" },
  ABSENT_JUSTIFIED: { label: "Ausente justificado", variant: "info" },
  ON_LEAVE: { label: "Licença", variant: "info" },
  TRANSFERRED: { label: "Transferido", variant: "secondary" },
  LEFT: { label: "Saiu", variant: "danger" },
  DECEASED: { label: "Faleceu", variant: "danger" },
  UNKNOWN: { label: "Não conheço", variant: "warning" },
  PAY: { label: "Paga", variant: "success" },
  HOLD: { label: "Retém", variant: "warning" },
  SUSPEND: { label: "Suspende", variant: "danger" },
  HIGH: { label: "Risco alto", variant: "danger" },
  MEDIUM: { label: "Risco médio", variant: "warning" },
  ACTIVE: { label: "Activo", variant: "success" },
  IN_TRANSIT: { label: "Em trânsito", variant: "info" },
  DISPLACED: { label: "Deslocado", variant: "warning" },
  ADMISSION_PENDING: { label: "Admissão pendente", variant: "warning" },
  NO_UNIT: { label: "Sem unidade", variant: "warning" },
};

export function FolhaBadge({ value }: { value: string }) {
  const spec = marks[value] ?? { label: value, variant: "muted" as const };
  return <Badge variant={spec.variant}>{spec.label}</Badge>;
}
