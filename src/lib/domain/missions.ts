import { isoWeekday, weekDates } from "./dates";

export type Frequency =
  | { type: "daily" }
  /** Días concretos de la semana (1 = lunes … 7 = domingo). */
  | { type: "weekdays"; days: number[] }
  /** N veces por semana, el día que quieras. */
  | { type: "weekly"; times: number };

export type MissionKind = "check" | "steps";

export interface MissionDef {
  id: string;
  title: string;
  icon: string;
  category: string;
  points: number;
  frequency: Frequency;
  /** "both" o el id de un usuario. */
  assignee: string;
  requiresValidation: boolean;
  kind: MissionKind;
  /** Objetivo de pasos para misiones de tipo "steps". */
  target: number | null;
  /** Reto semanal: los puntos se dan al completar la última vez de la semana. */
  isChallenge: boolean;
  active: boolean;
}

export type CompletionStatus = "approved" | "pending" | "rejected";

export interface CompletionRef {
  missionId: string;
  userId: string;
  date: string;
  status: CompletionStatus;
}

export function isAssignedTo(m: Pick<MissionDef, "assignee">, userId: string): boolean {
  return m.assignee === "both" || m.assignee === userId;
}

/** Cuántas veces hay que hacer la misión en la semana (para semanales y retos). */
export function weeklyTarget(m: Pick<MissionDef, "frequency">): number {
  return m.frequency.type === "weekly" ? Math.max(1, m.frequency.times) : 1;
}

/** ¿La misión toca este día (independientemente de si ya está hecha)? */
export function isScheduledOn(m: Pick<MissionDef, "frequency">, date: string): boolean {
  switch (m.frequency.type) {
    case "daily":
      return true;
    case "weekdays":
      return m.frequency.days.includes(isoWeekday(date));
    case "weekly":
      return true;
  }
}

export interface MissionDayState {
  mission: MissionDef;
  /** Completado de hoy (si existe). */
  today: CompletionStatus | null;
  /** Veces hechas esta semana (sin contar rechazadas). Solo relevante en semanales. */
  weekCount: number;
  weekTarget: number;
}

/**
 * Misiones que un usuario ve hoy: las programadas para hoy y asignadas a él.
 * Una semanal ya cumplida esta semana sigue apareciendo solo si se hizo hoy.
 */
export function missionsForDay(
  missions: MissionDef[],
  completions: CompletionRef[],
  userId: string,
  date: string,
): MissionDayState[] {
  const week = new Set(weekDates(date));
  return missions
    .filter((m) => m.active && isAssignedTo(m, userId) && isScheduledOn(m, date))
    .map((m) => {
      const mine = completions.filter(
        (c) => c.missionId === m.id && c.userId === userId && c.status !== "rejected",
      );
      const todayC = completions.find(
        (c) => c.missionId === m.id && c.userId === userId && c.date === date,
      );
      return {
        mission: m,
        today: todayC?.status ?? null,
        weekCount: mine.filter((c) => week.has(c.date)).length,
        weekTarget: weeklyTarget(m),
      };
    })
    .filter((s) => s.mission.frequency.type !== "weekly" || s.today !== null || s.weekCount < s.weekTarget);
}

/** Puede completarse hoy: no hecha hoy (o rechazada) y no superado el cupo semanal. */
export function canComplete(state: MissionDayState): boolean {
  if (state.today === "approved" || state.today === "pending") return false;
  return state.weekCount < state.weekTarget;
}
