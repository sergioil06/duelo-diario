/**
 * Utilidades de fechas. Todo el "día" de la app se calcula en Europe/Madrid,
 * así que el reinicio de misiones a medianoche es implícito: cada completado
 * se guarda con su fecha local (YYYY-MM-DD) y al cambiar de día ya no cuenta.
 */
export const APP_TIME_ZONE = "Europe/Madrid";

/** Fecha local YYYY-MM-DD en la zona horaria de la app. */
export function localDate(now: Date = new Date(), timeZone = APP_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function toUTC(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fromUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const d = toUTC(date);
  d.setUTCDate(d.getUTCDate() + days);
  return fromUTC(d);
}

/** Día de la semana ISO: 1 = lunes … 7 = domingo. */
export function isoWeekday(date: string): number {
  const wd = toUTC(date).getUTCDay();
  return wd === 0 ? 7 : wd;
}

/** Lunes de la semana de `date`. */
export function weekStart(date: string): string {
  return addDays(date, 1 - isoWeekday(date));
}

export function weekDates(date: string): string[] {
  const start = weekStart(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function monthStart(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

/** Diferencia en días (b - a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((toUTC(b).getTime() - toUTC(a).getTime()) / 86_400_000);
}
