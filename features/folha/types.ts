export const FOLHA_ROLES = ["chief", "auditor", "cedsif", "employee"] as const;
export type FolhaRole = (typeof FOLHA_ROLES)[number];

export const FOLHA_ROLE_COOKIE = "folha-role";

export const NEGATIVE_MARKS = ["LEFT", "DECEASED", "UNKNOWN"] as const;
export type NegativeMark = (typeof NEGATIVE_MARKS)[number];

export type FolhaEmployeeSnapshot = {
  id: string;
  name: string;
  nuit: string;
  identityCard: string;
  bornAt: Date;
  faceToken: string;
  accountNumber: string;
  accountHolder: string;
  salaryMzn: number;
  status: string;
  receivesPension: boolean;
  operatorId: string;
  createdWithoutProcess: boolean;
  unitId: string | null;
};

export type FolhaUnitSnapshot = {
  id: string;
  name: string;
  chiefEmployeeId: string | null;
  staffCount: number;
  admissionCount: number;
};

export type DetectedAnomaly = {
  type:
    | "SHARED_ACCOUNT"
    | "ACCOUNT_HOLDER_MISMATCH"
    | "DUPLICATE_FACE"
    | "DUPLICATE_NUIT"
    | "DUPLICATE_ID"
    | "SALARY_AND_PENSION"
    | "OVER_RETIREMENT_AGE"
    | "NO_UNIT"
    | "NO_CHIEF"
    | "GROWTH_WITHOUT_ADMISSION"
    | "UNUSUAL_OPERATOR";
  risk: "HIGH" | "MEDIUM";
  employeeId?: string;
  unitId?: string;
  detail: string;
};

export type PaymentContext = {
  employeeStatus: string;
  attestation: string | null;
  chiefCompletedRoster: boolean;
  highRisk: boolean;
  mediumRisk: boolean;
  transitDays: number | null;
  negativeMarkWarned: boolean;
  contestWon: boolean;
  drawFailed: boolean;
};

export type PaymentDecision = "PAY" | "HOLD" | "SUSPEND";

export type PaymentResult = {
  decision: PaymentDecision;
  reason: string;
};

export function isFolhaRole(value: unknown): value is FolhaRole {
  return typeof value === "string" && (FOLHA_ROLES as readonly string[]).includes(value);
}

export function isNegativeMark(mark: string | null): mark is NegativeMark {
  return mark !== null && (NEGATIVE_MARKS as readonly string[]).includes(mark);
}

export function roleHome(role: FolhaRole) {
  if (role === "chief") return "/folha/chefe";
  if (role === "auditor") return "/folha/auditor";
  if (role === "cedsif") return "/folha/cedsif";
  return "/folha/funcionario";
}
