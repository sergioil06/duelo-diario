import { addDays, monthStart, weekStart } from "./dates";
import type { LedgerCompletion } from "./points";

export type Period = "day" | "week" | "month" | "all";

/** Primer día incluido en el periodo que contiene `today` (null = desde siempre). */
export function periodStart(period: Period, today: string): string | null {
  if (period === "day") return today;
  if (period === "week") return weekStart(today);
  if (period === "month") return monthStart(today);
  return null;
}

export interface Standing {
  userId: string;
  points: number;
  missions: number;
}

/** Clasificación de un periodo, de más a menos puntos. Solo cuentan las aprobadas. */
export function standings(ledger: LedgerCompletion[], userIds: string[], from: string | null, to?: string): Standing[] {
  return userIds
    .map((userId) => {
      const rows = ledger.filter(
        (c) => c.userId === userId && c.status === "approved" && (from === null || c.date >= from) && (!to || c.date <= to),
      );
      return { userId, points: rows.reduce((s, c) => s + c.points, 0), missions: rows.length };
    })
    .sort((a, b) => b.points - a.points);
}

export interface WeekResult {
  weekStart: string;
  weekEnd: string;
  scores: Standing[];
  /** null si hubo empate (o nadie hizo nada). */
  winner: string | null;
}

/**
 * Resultados de las semanas ya terminadas (de la más reciente a la más antigua),
 * desde la semana del primer completado hasta la anterior a la actual.
 */
export function weeklyResults(ledger: LedgerCompletion[], userIds: string[], today: string): WeekResult[] {
  const approved = ledger.filter((c) => c.status === "approved");
  if (approved.length === 0) return [];
  const first = weekStart(approved.reduce((min, c) => (c.date < min ? c.date : min), approved[0].date));
  const current = weekStart(today);
  const out: WeekResult[] = [];
  for (let ws = first; ws < current; ws = addDays(ws, 7)) {
    const we = addDays(ws, 6);
    const scores = standings(approved, userIds, ws, we);
    const [a, b] = scores;
    const winner = a && a.points > 0 && (!b || a.points > b.points) ? a.userId : null;
    out.push({ weekStart: ws, weekEnd: we, scores, winner });
  }
  return out.reverse();
}

export function winsByUser(results: WeekResult[]): Record<string, number> {
  const wins: Record<string, number> = {};
  for (const r of results) if (r.winner) wins[r.winner] = (wins[r.winner] ?? 0) + 1;
  return wins;
}

/** Semanas seguidas ganadas hasta la última terminada. */
export function winStreak(results: WeekResult[], userId: string): number {
  let n = 0;
  for (const r of results) {
    if (r.winner !== userId) break;
    n++;
  }
  return n;
}
