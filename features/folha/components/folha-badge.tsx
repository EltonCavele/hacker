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
  NO_SHOW: { label: "Não apareceu", variant: "warning" },
  LOCATION_FAIL: { label: "Fora do posto", variant: "danger" },
  NOT_A_LIVE_FACE: { label: "Não é pessoa real", variant: "danger" },
  MATCH: { label: "Feito", variant: "success" },
  SHARED_ACCOUNT: { label: "Conta partilhada", variant: "danger" },
  ACCOUNT_HOLDER_MISMATCH: { label: "Titular diferente", variant: "danger" },
  DUPLICATE_FACE: { label: "Rosto repetido", variant: "danger" },
  DUPLICATE_NUIT: { label: "NUIT repetido", variant: "danger" },
  DUPLICATE_ID: { label: "BI repetido", variant: "danger" },
  SALARY_AND_PENSION: { label: "Salário e pensão", variant: "warning" },
  OVER_RETIREMENT_AGE: { label: "Acima da reforma", variant: "warning" },
  NO_CHIEF: { label: "Sem chefe", variant: "warning" },
  GROWTH_WITHOUT_ADMISSION: { label: "Cresceu sem admissão", variant: "warning" },
  UNUSUAL_OPERATOR: { label: "Operador fora do padrão", variant: "warning" },
  TRANSFER: { label: "Transferência", variant: "info" },
  ADMISSION: { label: "Admissão", variant: "info" },
  DEATH: { label: "Óbito", variant: "danger" },
  RETIREMENT: { label: "Reforma", variant: "secondary" },
  ABANDONMENT: { label: "Abandono", variant: "danger" },
  OPEN: { label: "Em análise", variant: "warning" },
  VERIFIED_GENUINE: { label: "Genuíno", variant: "success" },
  VERIFIED_GHOST: { label: "Fantasma", variant: "danger" },
  DISCIPLINARY: { label: "Disciplinar", variant: "warning" },
};

export function FolhaBadge({ value }: { value: string }) {
  const spec = marks[value] ?? { label: value, variant: "muted" as const };
  return <Badge variant={spec.variant}>{spec.label}</Badge>;
}
