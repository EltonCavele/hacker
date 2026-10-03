import { describe, expect, it } from "vitest";
import { directionIdFor, isDirectorate, summarizeDirections, type DirectionUnit } from "./directions";

const units: DirectionUnit[] = [
  { id: "sdejt", name: "SDEJT Marracuene", type: "direcção distrital", district: "Marracuene", province: "Maputo", parentId: null, chiefName: "Arnaldo Cossa" },
  { id: "escola", name: "Escola Primária Completa Marracuene", type: "escola", district: "Marracuene", province: "Maputo", parentId: "sdejt", chiefName: "Ilda Muianga" },
  { id: "saude", name: "Centro de Saúde Marracuene", type: "unidade sanitária", district: "Marracuene", province: "Maputo", parentId: null, chiefName: "Hélder Banze" },
];

describe("directions", () => {
  it("rolls a school into its directorate and keeps a standalone unit", () => {
    const byId = new Map(units.map((unit) => [unit.id, unit]));
    expect(isDirectorate("direcção distrital")).toBe(true);
    expect(directionIdFor("escola", byId)).toBe("sdejt");
    expect(directionIdFor("saude", byId)).toBe("saude");
    expect(directionIdFor(null, byId)).toBe("sem-unidade");

    const summaries = summarizeDirections(units, [
      { unitId: "escola", salaryMzn: 100, released: true },
      { unitId: "sdejt", salaryMzn: 200, released: false },
      { unitId: "saude", salaryMzn: 300, released: true },
      { unitId: null, salaryMzn: 50, released: false },
    ]);

    const sdejt = summaries.find((row) => row.id === "sdejt");
    expect(sdejt?.releasedCount).toBe(1);
    expect(sdejt?.heldCount).toBe(1);
    expect(sdejt?.unitIds).toEqual(["sdejt", "escola"]);
    expect(summaries.map((row) => row.id)).toEqual(["saude", "sdejt", "sem-unidade"]);
  });
});
