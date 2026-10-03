import type { DetectedAnomaly, FolhaEmployeeSnapshot, FolhaUnitSnapshot } from "./types";

const RETIREMENT_AGE = 60;
const UNUSUAL_OPERATOR_THRESHOLD = 4;

function ageYears(bornAt: Date, now: Date) {
  const years = now.getUTCFullYear() - bornAt.getUTCFullYear();
  const beforeBirthday =
    now.getUTCMonth() < bornAt.getUTCMonth() ||
    (now.getUTCMonth() === bornAt.getUTCMonth() && now.getUTCDate() < bornAt.getUTCDate());
  return beforeBirthday ? years - 1 : years;
}

function duplicates<T>(items: T[], key: (item: T) => string) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const value = key(item);
    const group = groups.get(value) ?? [];
    group.push(item);
    groups.set(value, group);
  }
  return [...groups.values()].filter((group) => group.length > 1);
}

/** Crosses payroll snapshots before payment. High-risk alerts hold pay; medium-risk alerts pay and queue verification. */
export function detectAnomalies(
  employees: FolhaEmployeeSnapshot[],
  units: FolhaUnitSnapshot[],
  now = new Date(),
): DetectedAnomaly[] {
  const alerts: DetectedAnomaly[] = [];
  const unitById = new Map(units.map((unit) => [unit.id, unit]));
  const payable = employees.filter((employee) => employee.status !== "LEFT" && employee.status !== "DECEASED");

  for (const group of duplicates(payable, (employee) => employee.accountNumber)) {
    for (const employee of group) {
      alerts.push({
        type: "SHARED_ACCOUNT",
        risk: "HIGH",
        employeeId: employee.id,
        detail: `Several salaries share account ${employee.accountNumber}`,
      });
    }
  }

  for (const employee of payable) {
    if (employee.accountHolder.trim().toLowerCase() !== employee.name.trim().toLowerCase()) {
      alerts.push({
        type: "ACCOUNT_HOLDER_MISMATCH",
        risk: "HIGH",
        employeeId: employee.id,
        detail: `Account holder ${employee.accountHolder} does not match ${employee.name}`,
      });
    }
  }

  for (const group of duplicates(payable, (employee) => employee.faceToken)) {
    for (const employee of group) {
      alerts.push({
        type: "DUPLICATE_FACE",
        risk: "HIGH",
        employeeId: employee.id,
        detail: `Face token ${employee.faceToken} appears on more than one record`,
      });
    }
  }

  for (const group of duplicates(employees, (employee) => employee.nuit)) {
    for (const employee of group) {
      alerts.push({
        type: "DUPLICATE_NUIT",
        risk: "HIGH",
        employeeId: employee.id,
        detail: `NUIT ${employee.nuit} is duplicated`,
      });
    }
  }

  for (const group of duplicates(employees, (employee) => employee.identityCard)) {
    for (const employee of group) {
      alerts.push({
        type: "DUPLICATE_ID",
        risk: "HIGH",
        employeeId: employee.id,
        detail: `Identity card ${employee.identityCard} is duplicated`,
      });
    }
  }

  for (const employee of payable) {
    if (employee.receivesPension) {
      alerts.push({
        type: "SALARY_AND_PENSION",
        risk: "HIGH",
        employeeId: employee.id,
        detail: `${employee.name} receives a salary and a pension`,
      });
    }
    if (ageYears(employee.bornAt, now) >= RETIREMENT_AGE) {
      alerts.push({
        type: "OVER_RETIREMENT_AGE",
        risk: "MEDIUM",
        employeeId: employee.id,
        detail: `${employee.name} is at or above retirement age`,
      });
    }
    if (!employee.unitId || employee.status === "NO_UNIT") {
      alerts.push({
        type: "NO_UNIT",
        risk: "MEDIUM",
        employeeId: employee.id,
        detail: `${employee.name} has no work unit`,
      });
    } else {
      const unit = unitById.get(employee.unitId);
      if (unit && !unit.chiefEmployeeId) {
        alerts.push({
          type: "NO_CHIEF",
          risk: "MEDIUM",
          employeeId: employee.id,
          unitId: unit.id,
          detail: `${unit.name} has no responsible chief`,
        });
      }
    }
  }

  for (const unit of units) {
    if (unit.staffCount > 1 && unit.admissionCount === 0 && unit.staffCount >= 4) {
      alerts.push({
        type: "GROWTH_WITHOUT_ADMISSION",
        risk: "MEDIUM",
        unitId: unit.id,
        detail: `${unit.name} grew without recorded admissions`,
      });
    }
  }

  const byOperator = new Map<string, FolhaEmployeeSnapshot[]>();
  for (const employee of employees.filter((item) => item.createdWithoutProcess)) {
    const group = byOperator.get(employee.operatorId) ?? [];
    group.push(employee);
    byOperator.set(employee.operatorId, group);
  }
  for (const [operatorId, group] of byOperator) {
    if (group.length >= UNUSUAL_OPERATOR_THRESHOLD) {
      for (const employee of group) {
        alerts.push({
          type: "UNUSUAL_OPERATOR",
          risk: "MEDIUM",
          employeeId: employee.id,
          detail: `Operator ${operatorId} created ${group.length} records without a process`,
        });
      }
    }
  }

  return alerts;
}

export function highestRisk(alerts: Array<{ risk: "HIGH" | "MEDIUM" }>): "HIGH" | "MEDIUM" | null {
  if (alerts.some((alert) => alert.risk === "HIGH")) return "HIGH";
  if (alerts.length > 0) return "MEDIUM";
  return null;
}
