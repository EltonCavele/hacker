export type QueueItem = { unitId: string; employeeId: string; mark: string; justification?: string };

export function queueKey(cycleId: string, unitId: string) {
  return `folha-offline:${cycleId}:${unitId}`;
}

export function signedKey(cycleId: string, unitId: string) {
  return `folha-signed:${cycleId}:${unitId}`;
}

export function unlockedKey() {
  return "folha-unlocked";
}

export const MARK_OPTIONS = [
  { value: "PRESENT", label: "Presente" },
  { value: "ABSENT_JUSTIFIED", label: "Ausente com justificação" },
  { value: "ON_LEAVE", label: "Licença ou formação" },
  { value: "TRANSFERRED", label: "Transferido" },
  { value: "LEFT", label: "Saiu ou abandonou" },
  { value: "DECEASED", label: "Faleceu" },
  { value: "UNKNOWN", label: "Não conheço esta pessoa" },
] as const;

export function monthLabel(yearMonth: string) {
  const [year, month] = yearMonth.split("-").map(Number);
  const names = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  return `${names[(month ?? 1) - 1] ?? yearMonth} ${year ?? ""}`.trim();
}

export function daysUntil(closeIso: string) {
  const close = new Date(closeIso);
  const now = new Date();
  return Math.max(0, Math.ceil((close.getTime() - now.getTime()) / 86_400_000));
}
