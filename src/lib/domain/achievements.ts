/**
 * Logros: se calculan a partir del historial, así que no hace falta guardarlos.
 * Cada uno tiene un progreso (actual / objetivo) para enseñar cuánto falta.
 */
export interface PlayerStats {
  totalPoints: number;
  missionsDone: number;
  bestStreak: number;
  weeklyWins: number;
  winStreak: number;
  challengesDone: number;
  perfectDays: number;
  validationsGiven: number;
  byCategory: Record<string, number>;
  maxStepsDay: number;
}

export type Tier = "bronce" | "plata" | "oro" | "diamante";

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier: Tier;
  target: number;
  value: (s: PlayerStats) => number;
}

const ladder = (
  base: string,
  icon: string,
  value: (s: PlayerStats) => number,
  steps: [number, Tier, string, string][],
): AchievementDef[] =>
  steps.map(([target, tier, title, description]) => ({ id: `${base}-${target}`, title, description, icon, tier, target, value }));

export const ACHIEVEMENTS: AchievementDef[] = [
  ...ladder("missions", "check", (s) => s.missionsDone, [
    [1, "bronce", "Primer paso", "Completa tu primera misión"],
    [50, "plata", "Constante", "Completa 50 misiones"],
    [250, "oro", "Imparable", "Completa 250 misiones"],
    [1000, "diamante", "Leyenda", "Completa 1.000 misiones"],
  ]),
  ...ladder("streak", "flame", (s) => s.bestStreak, [
    [3, "bronce", "Calentando", "Racha de 3 días"],
    [7, "plata", "Semana redonda", "Racha de 7 días"],
    [30, "oro", "Mes de hierro", "Racha de 30 días"],
    [100, "diamante", "Centenario", "Racha de 100 días"],
  ]),
  ...ladder("points", "star", (s) => s.totalPoints, [
    [500, "bronce", "Sumando", "Consigue 500 puntos"],
    [2500, "plata", "Coleccionista", "Consigue 2.500 puntos"],
    [10000, "oro", "Millonario de puntos", "Consigue 10.000 puntos"],
  ]),
  ...ladder("wins", "trophy", (s) => s.weeklyWins, [
    [1, "bronce", "Campeón de la semana", "Gana una semana"],
    [5, "plata", "Pentacampeón", "Gana 5 semanas"],
    [20, "oro", "Dinastía", "Gana 20 semanas"],
  ]),
  ...ladder("winstreak", "crown", (s) => s.winStreak, [[3, "oro", "Tricampeón", "Gana 3 semanas seguidas"]]),
  ...ladder("perfect", "sparkle", (s) => s.perfectDays, [
    [1, "bronce", "Día perfecto", "Completa todas tus misiones de un día"],
    [10, "plata", "Perfeccionista", "10 días perfectos"],
  ]),
  ...ladder("challenge", "target", (s) => s.challengesDone, [
    [1, "plata", "Reto superado", "Completa un reto semanal"],
    [10, "oro", "Cazarretos", "Completa 10 retos semanales"],
  ]),
  ...ladder("fair", "shield", (s) => s.validationsGiven, [[10, "bronce", "Árbitro justo", "Valida 10 misiones de tu pareja"]]),
  ...ladder("sport", "gym", (s) => s.byCategory.deporte ?? 0, [[30, "plata", "Atleta", "30 misiones de deporte"]]),
  ...ladder("home", "house", (s) => s.byCategory.hogar ?? 0, [[30, "plata", "Casa de revista", "30 misiones de hogar"]]),
  ...ladder("mind", "book", (s) => s.byCategory.mente ?? 0, [[30, "plata", "Mente brillante", "30 misiones de mente"]]),
  ...ladder("steps", "steps", (s) => s.maxStepsDay, [[20000, "oro", "Maratoniano", "20.000 pasos en un día"]]),
];

export interface AchievementState {
  def: AchievementDef;
  current: number;
  unlocked: boolean;
}

export function evaluateAchievements(stats: PlayerStats): AchievementState[] {
  return ACHIEVEMENTS.map((def) => {
    const current = def.value(stats);
    return { def, current: Math.min(current, def.target), unlocked: current >= def.target };
  });
}
