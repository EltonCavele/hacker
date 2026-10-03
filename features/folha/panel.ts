export const UNASSIGNED_MUNICIPALITY = "Sem município";

export const SECTOR_LABEL: Record<string, string> = {
  EDUCATION: "Educação",
  HEALTH: "Saúde",
  DISTRICT_ADMIN: "Administração distrital",
  POLICE: "Polícia",
  CENTRAL: "Administração central",
};

export type PanelUnitInput = {
  id: string;
  name: string;
  district: string;
  province: string;
  sector: string;
  chiefEmployeeId: string | null;
};

export type PanelPayrollInput = {
  unitId: string | null;
  district: string | null;
  salaryMzn: number;
  verified: boolean;
  attested: boolean;
  decision: "PAY" | "HOLD" | "SUSPEND";
};

export type PanelAuditInput = {
  unitId: string;
  district: string | null;
  discrepancy: boolean;
};

export type PanelAnomalyInput = {
  unitId: string | null;
  district: string | null;
  risk: "HIGH" | "MEDIUM";
};

export type MunicipalityStat = {
  municipality: string;
  province: string;
  unitCount: number;
  staff: number;
  payrollMzn: number;
  owned: number;
  verified: number;
  attestedOnTime: number;
  discrepancies: number;
  pay: number;
  hold: number;
  suspend: number;
  highRisk: number;
  mediumRisk: number;
};

export type UnitStat = {
  id: string;
  name: string;
  municipality: string;
  province: string;
  sector: string;
  sectorLabel: string;
  staff: number;
  payrollMzn: number;
  verified: number;
  attested: number;
  hasChief: boolean;
  discrepancies: number;
  pay: number;
  hold: number;
  suspend: number;
  highRisk: number;
  mediumRisk: number;
};

export type SectorStat = {
  sector: string;
  label: string;
  units: number;
  staff: number;
  payrollMzn: number;
};

export type PanelTotals = {
  municipalities: number;
  units: number;
  staff: number;
  payrollMzn: number;
  owned: number;
  verified: number;
  attestedOnTime: number;
  discrepancies: number;
  pay: number;
  hold: number;
  suspend: number;
  highRisk: number;
  mediumRisk: number;
};

export type PanelStats = {
  municipalities: MunicipalityStat[];
  units: UnitStat[];
  sectors: SectorStat[];
  totals: PanelTotals;
};

export function formatMzn(value: number) {
  return `${new Intl.NumberFormat("pt", { maximumFractionDigits: 0 }).format(value)} MZN`;
}

export function emptyPanelStats(): PanelStats {
  return {
    municipalities: [],
    units: [],
    sectors: [],
    totals: {
      municipalities: 0,
      units: 0,
      staff: 0,
      payrollMzn: 0,
      owned: 0,
      verified: 0,
      attestedOnTime: 0,
      discrepancies: 0,
      pay: 0,
      hold: 0,
      suspend: 0,
      highRisk: 0,
      mediumRisk: 0,
    },
  };
}

function percent(part: number, whole: number) {
  if (whole === 0) return 0;
  return Math.round((part / whole) * 100);
}

function compareMunicipality(a: string, b: string) {
  if (a === UNASSIGNED_MUNICIPALITY) return 1;
  if (b === UNASSIGNED_MUNICIPALITY) return -1;
  return a.localeCompare(b, "pt");
}

function sectorLabel(sector: string) {
  return SECTOR_LABEL[sector] ?? sector;
}

export function buildPanelStats(input: {
  units: PanelUnitInput[];
  payroll: PanelPayrollInput[];
  audits: PanelAuditInput[];
  anomalies: PanelAnomalyInput[];
}): PanelStats {
  const unitsByMunicipality = new Map<string, PanelUnitInput[]>();
  for (const unit of input.units) {
    const list = unitsByMunicipality.get(unit.district) ?? [];
    list.push(unit);
    unitsByMunicipality.set(unit.district, list);
  }

  const payrollByMunicipality = new Map<string, PanelPayrollInput[]>();
  for (const row of input.payroll) {
    const key = row.district ?? UNASSIGNED_MUNICIPALITY;
    const list = payrollByMunicipality.get(key) ?? [];
    list.push(row);
    payrollByMunicipality.set(key, list);
  }

  const names = new Set<string>([...unitsByMunicipality.keys(), ...payrollByMunicipality.keys()]);
  const chiefByUnit = new Map(input.units.map((unit) => [unit.id, unit.chiefEmployeeId]));
  const provinceByMunicipality = new Map(input.units.map((unit) => [unit.district, unit.province]));

  const municipalities = [...names].sort(compareMunicipality).map((municipality) => {
    const units = unitsByMunicipality.get(municipality) ?? [];
    const payroll = payrollByMunicipality.get(municipality) ?? [];
    const unitIds = new Set(units.map((unit) => unit.id));
    const attestedUnits = units.filter((unit) => payroll.some((row) => row.unitId === unit.id && row.attested)).length;
    const withChief = payroll.filter((row) => row.unitId && chiefByUnit.get(row.unitId)).length;
    const audits = input.audits.filter((audit) => audit.district === municipality || unitIds.has(audit.unitId));
    const anomalies = input.anomalies.filter(
      (alert) => alert.district === municipality || (alert.unitId != null && unitIds.has(alert.unitId)),
    );
    return {
      municipality,
      province: provinceByMunicipality.get(municipality) ?? "—",
      unitCount: units.length,
      staff: payroll.length,
      payrollMzn: payroll.reduce((sum, row) => sum + row.salaryMzn, 0),
      owned: percent(withChief, payroll.length),
      verified: percent(payroll.filter((row) => row.verified).length, payroll.length),
      attestedOnTime: percent(attestedUnits, units.length),
      discrepancies: audits.filter((audit) => audit.discrepancy).length,
      pay: payroll.filter((row) => row.decision === "PAY").length,
      hold: payroll.filter((row) => row.decision === "HOLD").length,
      suspend: payroll.filter((row) => row.decision === "SUSPEND").length,
      highRisk: anomalies.filter((alert) => alert.risk === "HIGH").length,
      mediumRisk: anomalies.filter((alert) => alert.risk === "MEDIUM").length,
    };
  });

  const units = input.units
    .map((unit) => {
      const payroll = input.payroll.filter((row) => row.unitId === unit.id);
      const audits = input.audits.filter((audit) => audit.unitId === unit.id);
      const anomalies = input.anomalies.filter((alert) => alert.unitId === unit.id);
      return {
        id: unit.id,
        name: unit.name,
        municipality: unit.district,
        province: unit.province,
        sector: unit.sector,
        sectorLabel: sectorLabel(unit.sector),
        staff: payroll.length,
        payrollMzn: payroll.reduce((sum, row) => sum + row.salaryMzn, 0),
        verified: percent(payroll.filter((row) => row.verified).length, payroll.length),
        attested: payroll.filter((row) => row.attested).length,
        hasChief: Boolean(unit.chiefEmployeeId),
        discrepancies: audits.filter((audit) => audit.discrepancy).length,
        pay: payroll.filter((row) => row.decision === "PAY").length,
        hold: payroll.filter((row) => row.decision === "HOLD").length,
        suspend: payroll.filter((row) => row.decision === "SUSPEND").length,
        highRisk: anomalies.filter((alert) => alert.risk === "HIGH").length,
        mediumRisk: anomalies.filter((alert) => alert.risk === "MEDIUM").length,
      };
    })
    .sort((a, b) => {
      const byMunicipality = compareMunicipality(a.municipality, b.municipality);
      if (byMunicipality !== 0) return byMunicipality;
      return b.staff - a.staff || a.name.localeCompare(b.name, "pt");
    });

  const sectorNames = [...new Set(input.units.map((unit) => unit.sector))].sort((a, b) =>
    sectorLabel(a).localeCompare(sectorLabel(b), "pt"),
  );
  const sectors = sectorNames.map((sector) => {
    const sectorUnits = input.units.filter((unit) => unit.sector === sector);
    const unitIds = new Set(sectorUnits.map((unit) => unit.id));
    const payroll = input.payroll.filter((row) => row.unitId != null && unitIds.has(row.unitId));
    return {
      sector,
      label: sectorLabel(sector),
      units: sectorUnits.length,
      staff: payroll.length,
      payrollMzn: payroll.reduce((sum, row) => sum + row.salaryMzn, 0),
    };
  });

  const attestedUnits = input.units.filter((unit) =>
    input.payroll.some((row) => row.unitId === unit.id && row.attested),
  ).length;
  const withChief = input.payroll.filter((row) => row.unitId && chiefByUnit.get(row.unitId)).length;

  return {
    municipalities,
    units,
    sectors,
    totals: {
      municipalities: municipalities.filter((row) => row.municipality !== UNASSIGNED_MUNICIPALITY).length,
      units: input.units.length,
      staff: input.payroll.length,
      payrollMzn: input.payroll.reduce((sum, row) => sum + row.salaryMzn, 0),
      owned: percent(withChief, input.payroll.length),
      verified: percent(input.payroll.filter((row) => row.verified).length, input.payroll.length),
      attestedOnTime: percent(attestedUnits, input.units.length),
      discrepancies: input.audits.filter((audit) => audit.discrepancy).length,
      pay: input.payroll.filter((row) => row.decision === "PAY").length,
      hold: input.payroll.filter((row) => row.decision === "HOLD").length,
      suspend: input.payroll.filter((row) => row.decision === "SUSPEND").length,
      highRisk: input.anomalies.filter((alert) => alert.risk === "HIGH").length,
      mediumRisk: input.anomalies.filter((alert) => alert.risk === "MEDIUM").length,
    },
  };
}
