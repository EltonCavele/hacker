import { describe, expect, it } from "vitest";
import { buildPanelStats, emptyPanelStats, UNASSIGNED_MUNICIPALITY } from "./panel";

const units = [
  {
    id: "u1",
    name: "Escola de Marracuene",
    district: "Marracuene",
    province: "Maputo",
    sector: "EDUCATION",
    chiefEmployeeId: "c1",
  },
  {
    id: "u2",
    name: "Posto de Marracuene",
    district: "Marracuene",
    province: "Maputo",
    sector: "HEALTH",
    chiefEmployeeId: null,
  },
  {
    id: "u3",
    name: "Escola de Chiúre",
    district: "Chiúre",
    province: "Cabo Delgado",
    sector: "EDUCATION",
    chiefEmployeeId: "c2",
  },
];

describe("buildPanelStats", () => {
  it("returns zeros when there is nothing to count", () => {
    expect(buildPanelStats({ units: [], payroll: [], audits: [], anomalies: [] })).toEqual(emptyPanelStats());
  });

  it("rolls every unit up by municipality, sector and the whole state", () => {
    const stats = buildPanelStats({
      units,
      payroll: [
        { unitId: "u1", district: "Marracuene", salaryMzn: 10000, verified: true, attested: true, decision: "PAY" },
        { unitId: "u1", district: "Marracuene", salaryMzn: 8000, verified: false, attested: false, decision: "HOLD" },
        {
          unitId: "u2",
          district: "Marracuene",
          salaryMzn: 5000,
          verified: false,
          attested: false,
          decision: "SUSPEND",
        },
        { unitId: "u3", district: "Chiúre", salaryMzn: 9000, verified: true, attested: true, decision: "PAY" },
        { unitId: null, district: null, salaryMzn: 1000, verified: false, attested: false, decision: "HOLD" },
      ],
      audits: [
        { unitId: "u1", district: "Marracuene", discrepancy: true },
        { unitId: "u1", district: "Marracuene", discrepancy: false },
      ],
      anomalies: [
        { unitId: "u1", district: "Marracuene", risk: "HIGH" },
        { unitId: "u3", district: "Chiúre", risk: "MEDIUM" },
      ],
    });

    expect(stats.municipalities.map((row) => row.municipality)).toEqual([
      "Chiúre",
      "Marracuene",
      UNASSIGNED_MUNICIPALITY,
    ]);
    expect(stats.municipalities[1]).toMatchObject({
      province: "Maputo",
      unitCount: 2,
      staff: 3,
      payrollMzn: 23000,
      owned: 67,
      verified: 33,
      attestedOnTime: 50,
      discrepancies: 1,
      pay: 1,
      hold: 1,
      suspend: 1,
      highRisk: 1,
      mediumRisk: 0,
    });
    expect(stats.municipalities[0]).toMatchObject({
      staff: 1,
      owned: 100,
      verified: 100,
      attestedOnTime: 100,
      mediumRisk: 1,
    });
    expect(stats.municipalities[2]).toMatchObject({
      province: "—",
      unitCount: 0,
      staff: 1,
      payrollMzn: 1000,
      owned: 0,
      hold: 1,
    });
    expect(stats.units.map((unit) => unit.name)).toEqual([
      "Escola de Chiúre",
      "Escola de Marracuene",
      "Posto de Marracuene",
    ]);
    expect(stats.units[1]).toMatchObject({ verified: 50, attested: 1, hasChief: true, discrepancies: 1 });
    expect(stats.sectors).toEqual([
      { sector: "EDUCATION", label: "Educação", units: 2, staff: 3, payrollMzn: 27000 },
      { sector: "HEALTH", label: "Saúde", units: 1, staff: 1, payrollMzn: 5000 },
    ]);
    expect(stats.totals).toMatchObject({
      municipalities: 2,
      units: 3,
      staff: 5,
      payrollMzn: 33000,
      owned: 60,
      verified: 40,
      attestedOnTime: 67,
      discrepancies: 1,
      pay: 2,
      hold: 2,
      suspend: 1,
      highRisk: 1,
      mediumRisk: 1,
    });
  });
});
