/** Mulberry32: a small deterministic generator so tests can replay a month's draw. */
export function createRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let next = state;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], random: () => number) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

/**
 * Picks people to photograph at the post this month.
 * Everyone is chosen at least once in a 12-month window; extra draws keep the list unpredictable.
 */
export function pickMonthlyDraw(input: {
  employeeIds: string[];
  drawnThisYear: Record<string, number[]>;
  month: number;
  random?: () => number;
  extraPerUnit?: number;
}): string[] {
  const random = input.random ?? Math.random;
  const extra = input.extraPerUnit ?? 1;
  if (input.employeeIds.length === 0) return [];

  const overdue = input.employeeIds.filter((id) => !(input.drawnThisYear[id] ?? []).includes(input.month) && (input.drawnThisYear[id] ?? []).length === 0);
  const neverThisYear = input.employeeIds.filter((id) => (input.drawnThisYear[id] ?? []).length === 0);
  const mustPick = overdue.length > 0 ? overdue : neverThisYear.length > 0 ? [shuffle(neverThisYear, random)[0]] : [];

  const remaining = input.employeeIds.filter((id) => !mustPick.includes(id));
  const extras = shuffle(remaining, random).slice(0, Math.min(extra, remaining.length));
  return [...new Set([...mustPick, ...extras])];
}
