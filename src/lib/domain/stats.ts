import { addDays, monthStart, weekStart } from "./dates";
import type { LedgerCompletion } from "./points";

export type Bucket = "day" | "week" | "month";

export interface SeriesPoint {
  key: string;
  label: string;
  values: Record<string, number>;
}

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

function shiftMonth(m: string, by: number): string {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(Date.UTC(y, mo - 1 + by, 1));
  return d.toISOString().slice(0, 10);
}

/** Claves de los últimos `count` cubos, del más antiguo al actual. */
export function bucketKeys(bucket: Bucket, today: string, count: number): string[] {
  if (bucket === "day") return Array.from({ length: count }, (_, i) => addDays(today, i - count + 1));
  if (bucket === "week") return Array.from({ length: count }, (_, i) => addDays(weekStart(today), 7 * (i - count + 1)));
  return Array.from({ length: count }, (_, i) => shiftMonth(monthStart(today), i - count + 1));
}

export function bucketOf(bucket: Bucket, date: string): string {
  return bucket === "day" ? date : bucket === "week" ? weekStart(date) : monthStart(date);
}

export function bucketLabel(bucket: Bucket, key: string): string {
  const d = Number(key.slice(8, 10));
  const m = MONTHS[Number(key.slice(5, 7)) - 1];
  if (bucket === "day") {
    const wd = new Date(key + "T12:00:00Z").getUTCDay();
    return `${WEEKDAYS[wd === 0 ? 6 : wd - 1]} ${d}`;
  }
  if (bucket === "week") return `${d} ${m}`;
  return m;
}

/** Puntos aprobados por cubo y usuario. */
export function pointsSeries(
  ledger: LedgerCompletion[],
  userIds: string[],
  bucket: Bucket,
  today: string,
  count: number,
): SeriesPoint[] {
  const keys = bucketKeys(bucket, today, count);
  const index = new Map(keys.map((k, i) => [k, i]));
  const out: SeriesPoint[] = keys.map((key) => ({
    key,
    label: bucketLabel(bucket, key),
    values: Object.fromEntries(userIds.map((u) => [u, 0])),
  }));
  for (const c of ledger) {
    if (c.status !== "approved" || !userIds.includes(c.userId)) continue;
    const i = index.get(bucketOf(bucket, c.date));
    if (i !== undefined) out[i].values[c.userId] += c.points;
  }
  return out;
}

/** Puntos aprobados por categoría y usuario, ordenado por total. */
export function pointsByCategory(
  ledger: (LedgerCompletion & { category: string })[],
  userIds: string[],
): { category: string; values: Record<string, number> }[] {
  const map = new Map<string, Record<string, number>>();
  for (const c of ledger) {
    if (c.status !== "approved" || !userIds.includes(c.userId)) continue;
    const row = map.get(c.category) ?? Object.fromEntries(userIds.map((u) => [u, 0]));
    row[c.userId] += c.points;
    map.set(c.category, row);
  }
  const total = (v: Record<string, number>) => Object.values(v).reduce((a, b) => a + b, 0);
  return [...map.entries()].map(([category, values]) => ({ category, values })).sort((a, b) => total(b.values) - total(a.values));
}
