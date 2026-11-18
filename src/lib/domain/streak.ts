import { addDays } from "./dates";

/**
 * Racha: días seguidos con al menos una misión hecha (pendiente de validar
 * también cuenta; rechazada no). Si hoy aún no has hecho nada, la racha
 * de ayer sigue viva hasta medianoche.
 */
export function currentStreak(activeDates: Iterable<string>, today: string): number {
  const set = new Set(activeDates);
  let day = set.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (set.has(day)) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}

/** Racha más larga de la historia. */
export function bestStreak(activeDates: Iterable<string>): number {
  const sorted = [...new Set(activeDates)].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    run = prev !== null && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

/** Tramos de multiplicador por racha (días mínimos → multiplicador). */
export const STREAK_TIERS: ReadonlyArray<{ minDays: number; multiplier: number }> = [
  { minDays: 30, multiplier: 2 },
  { minDays: 14, multiplier: 1.5 },
  { minDays: 7, multiplier: 1.25 },
  { minDays: 3, multiplier: 1.1 },
  { minDays: 0, multiplier: 1 },
];

export function streakMultiplier(streak: number): number {
  return STREAK_TIERS.find((t) => streak >= t.minDays)!.multiplier;
}

/** Días que faltan para el siguiente tramo (null si ya estás en el máximo). */
export function nextTier(streak: number): { inDays: number; multiplier: number } | null {
  const higher = [...STREAK_TIERS].reverse().find((t) => t.minDays > streak);
  return higher ? { inDays: higher.minDays - streak, multiplier: higher.multiplier } : null;
}
