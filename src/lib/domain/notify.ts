/** Preferencias de notificaciones de cada persona y textos de los avisos. */
export interface NotifyPrefs {
  /** Horas (0-23, Europe/Madrid) a las que recordar misiones pendientes. */
  hours: number[];
  /** Avisar cuando la pareja completa una misión. */
  partnerActivity: boolean;
  /** Última hora a la que se envió un recordatorio, "YYYY-MM-DDTHH", para no repetir. */
  lastSent?: string;
}

export const DEFAULT_PREFS: NotifyPrefs = { hours: [20], partnerActivity: true };
export const REMINDER_HOURS = [9, 13, 18, 20, 22];

export function normalizePrefs(raw: unknown): NotifyPrefs {
  const p = (raw ?? {}) as Partial<NotifyPrefs>;
  const hours = Array.isArray(p.hours) ? [...new Set(p.hours.filter((h) => Number.isInteger(h) && h >= 0 && h <= 23))].sort((a, b) => a - b) : DEFAULT_PREFS.hours;
  return {
    hours,
    partnerActivity: typeof p.partnerActivity === "boolean" ? p.partnerActivity : DEFAULT_PREFS.partnerActivity,
    lastSent: typeof p.lastSent === "string" ? p.lastSent : undefined,
  };
}

/** ¿Toca recordar ahora? Solo a las horas elegidas, una vez por hora y si queda algo pendiente. */
export function shouldRemind(prefs: NotifyPrefs, date: string, hour: number, pending: number): boolean {
  return pending > 0 && prefs.hours.includes(hour) && prefs.lastSent !== slotKey(date, hour);
}

export function slotKey(date: string, hour: number): string {
  return `${date}T${String(hour).padStart(2, "0")}`;
}

export function reminderText(opts: { pending: number; mine: number; theirs: number; partner: string | null; streak: number }) {
  const { pending, mine, theirs, partner, streak } = opts;
  const title = pending === 1 ? "Te queda 1 misión hoy" : `Te quedan ${pending} misiones hoy`;
  let body: string;
  if (partner && theirs > mine) body = `${partner} te saca ${theirs - mine} puntos. ¡Aún puedes remontar!`;
  else if (partner && mine > theirs) body = `Vas ganando a ${partner} por ${mine - theirs}. No te relajes.`;
  else if (partner) body = `Vais empate con ${partner}. Desempata tú.`;
  else body = "¡A por ellas!";
  if (streak >= 3) body += ` Tu racha de ${streak} días está en juego.`;
  return { title, body };
}
