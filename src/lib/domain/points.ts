import { streakMultiplier } from "./streak";
import type { CompletionStatus, MissionDef } from "./missions";

/**
 * Dos monedas separadas:
 *  - puntos de ranking: solo suben, deciden quién gana.
 *  - monedas: se ganan igual que los puntos, pero se gastan en la tienda.
 * Gastar monedas NUNCA toca los puntos de ranking.
 */
export interface Award {
  points: number;
  coins: number;
  multiplier: number;
}

/**
 * Lo que da completar una misión.
 * @param streakAfter racha que tendrás contando el día de hoy.
 * @param weekCountAfter veces hechas esta semana incluyendo esta (retos).
 */
export function awardFor(
  mission: Pick<MissionDef, "points" | "isChallenge" | "frequency">,
  streakAfter: number,
  weekCountAfter = 1,
): Award {
  const multiplier = streakMultiplier(streakAfter);
  if (mission.isChallenge) {
    const target = mission.frequency.type === "weekly" ? mission.frequency.times : 1;
    // El reto solo paga al completarlo entero, y no se multiplica por racha.
    if (weekCountAfter < target) return { points: 0, coins: 0, multiplier: 1 };
    return { points: mission.points, coins: mission.points, multiplier: 1 };
  }
  const points = Math.round(mission.points * multiplier);
  return { points, coins: points, multiplier };
}

export interface LedgerCompletion {
  userId: string;
  date: string;
  status: CompletionStatus;
  points: number;
  coins: number;
}

export interface Spend {
  userId: string;
  coins: number;
}

/** Solo cuentan las aprobadas: las pendientes de validar aún no suman. */
export function rankingPoints(
  completions: LedgerCompletion[],
  userId: string,
  filter: (date: string) => boolean = () => true,
): number {
  return completions
    .filter((c) => c.userId === userId && c.status === "approved" && filter(c.date))
    .reduce((sum, c) => sum + c.points, 0);
}

export function coinBalance(completions: LedgerCompletion[], spends: Spend[], userId: string): number {
  const earned = completions
    .filter((c) => c.userId === userId && c.status === "approved")
    .reduce((sum, c) => sum + c.coins, 0);
  const spent = spends.filter((s) => s.userId === userId).reduce((sum, s) => sum + s.coins, 0);
  return earned - spent;
}
