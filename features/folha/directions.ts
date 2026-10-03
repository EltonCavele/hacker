export const NO_DIRECTION_ID = "sem-unidade";

export type DirectionUnit = {
  id: string;
  name: string;
  type: string;
  district: string;
  province: string;
  parentId: string | null;
  chiefName: string | null;
};

export type DirectionSummary = {
  id: string;
  name: string;
  type: string;
  district: string | null;
  province: string | null;
  chiefName: string | null;
  /** Units whose salaries roll up into this direction, including itself. */
  unitIds: string[];
  releasedCount: number;
  heldCount: number;
  releasedAmount: number;
  heldAmount: number;
};

export function directionUnitsFrom(
  units: Array<{
    id: string;
    name: string;
    type: string;
    district: string;
    province: string;
    parentId: string | null;
    chief: { name: string } | null;
  }>,
): DirectionUnit[] {
  return units.map((unit) => ({
    id: unit.id,
    name: unit.name,
    type: unit.type,
    district: unit.district,
    province: unit.province,
    parentId: unit.parentId,
    chiefName: unit.chief?.name ?? null,
  }));
}

export function isDirectorate(type: string) {
  return type.toLocaleLowerCase("pt").includes("direc");
}

export function directionIdFor(unitId: string | null, units: Map<string, DirectionUnit>) {
  if (!unitId) return NO_DIRECTION_ID;
  const unit = units.get(unitId);
  if (!unit) return NO_DIRECTION_ID;
  if (unit.parentId) {
    const parent = units.get(unit.parentId);
    if (parent && isDirectorate(parent.type)) return parent.id;
  }
  return unit.id;
}

export type AuditDirectionSummary = {
  id: string;
  name: string;
  type: string;
  district: string | null;
  province: string | null;
  chiefName: string | null;
  unitIds: string[];
  staff: number;
  visited: number;
  discrepancies: number;
  atRisk: number;
  openContests: number;
};

export function summarizeAuditDirections(
  units: DirectionUnit[],
  rows: { unitId: string | null; visited: boolean; discrepancy: boolean; atRisk: boolean; openContest: boolean }[],
): AuditDirectionSummary[] {
  const byId = new Map(units.map((unit) => [unit.id, unit]));
  const groups = new Map<string, AuditDirectionSummary>();

  function ensure(id: string): AuditDirectionSummary {
    const existing = groups.get(id);
    if (existing) return existing;
    if (id === NO_DIRECTION_ID) {
      const created: AuditDirectionSummary = {
        id,
        name: "Sem unidade",
        type: "Sem direcção",
        district: null,
        province: null,
        chiefName: null,
        unitIds: [],
        staff: 0,
        visited: 0,
        discrepancies: 0,
        atRisk: 0,
        openContests: 0,
      };
      groups.set(id, created);
      return created;
    }
    const unit = byId.get(id);
    const created: AuditDirectionSummary = {
      id,
      name: unit?.name ?? "Direcção",
      type: unit?.type ?? "unidade",
      district: unit?.district ?? null,
      province: unit?.province ?? null,
      chiefName: unit?.chiefName ?? null,
      unitIds: [],
      staff: 0,
      visited: 0,
      discrepancies: 0,
      atRisk: 0,
      openContests: 0,
    };
    groups.set(id, created);
    return created;
  }

  for (const unit of units) {
    const group = ensure(directionIdFor(unit.id, byId));
    if (!group.unitIds.includes(unit.id)) group.unitIds.push(unit.id);
  }

  for (const row of rows) {
    const group = ensure(directionIdFor(row.unitId, byId));
    group.staff += 1;
    if (row.visited) group.visited += 1;
    if (row.discrepancy) group.discrepancies += 1;
    if (row.atRisk) group.atRisk += 1;
    if (row.openContest) group.openContests += 1;
  }

  return [...groups.values()]
    .filter((group) => group.unitIds.length > 0 || group.staff > 0)
    .sort((left, right) => {
      if (left.id === NO_DIRECTION_ID) return 1;
      if (right.id === NO_DIRECTION_ID) return -1;
      return left.name.localeCompare(right.name, "pt");
    });
}

export function summarizeDirections(
  units: DirectionUnit[],
  rows: { unitId: string | null; salaryMzn: number; released: boolean }[],
): DirectionSummary[] {
  const byId = new Map(units.map((unit) => [unit.id, unit]));
  const groups = new Map<string, DirectionSummary>();

  function ensure(id: string): DirectionSummary {
    const existing = groups.get(id);
    if (existing) return existing;
    if (id === NO_DIRECTION_ID) {
      const created: DirectionSummary = {
        id,
        name: "Sem unidade",
        type: "Sem direcção",
        district: null,
        province: null,
        chiefName: null,
        unitIds: [],
        releasedCount: 0,
        heldCount: 0,
        releasedAmount: 0,
        heldAmount: 0,
      };
      groups.set(id, created);
      return created;
    }
    const unit = byId.get(id);
    const created: DirectionSummary = {
      id,
      name: unit?.name ?? "Direcção",
      type: unit?.type ?? "unidade",
      district: unit?.district ?? null,
      province: unit?.province ?? null,
      chiefName: unit?.chiefName ?? null,
      unitIds: unit ? [unit.id] : [],
      releasedCount: 0,
      heldCount: 0,
      releasedAmount: 0,
      heldAmount: 0,
    };
    groups.set(id, created);
    return created;
  }

  for (const unit of units) {
    const parent = unit.parentId ? byId.get(unit.parentId) : undefined;
    if (parent && isDirectorate(parent.type)) {
      const group = ensure(parent.id);
      if (!group.unitIds.includes(unit.id)) group.unitIds.push(unit.id);
    }
  }

  for (const row of rows) {
    const group = ensure(directionIdFor(row.unitId, byId));
    if (row.released) {
      group.releasedCount += 1;
      group.releasedAmount += row.salaryMzn;
    } else {
      group.heldCount += 1;
      group.heldAmount += row.salaryMzn;
    }
  }

  return [...groups.values()]
    .filter((group) => group.releasedCount + group.heldCount > 0)
    .sort((left, right) => {
      if (left.id === NO_DIRECTION_ID) return 1;
      if (right.id === NO_DIRECTION_ID) return -1;
      return left.name.localeCompare(right.name, "pt");
    });
}
