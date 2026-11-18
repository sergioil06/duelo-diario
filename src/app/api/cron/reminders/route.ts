import { NextResponse } from "next/server";
import { bearer, safeEqual } from "@/lib/auth/bearer";
import { getDb, schema } from "@/lib/db";
import { getDashboard } from "@/lib/game";
import { getPrefs, savePrefs, sendToUser } from "@/lib/push";
import { reminderText, shouldRemind, slotKey } from "@/lib/domain/notify";
import { localDate } from "@/lib/domain/dates";

export const dynamic = "force-dynamic";

/**
 * Recordatorio de misiones pendientes. Llamarlo cada hora (GitHub Actions) o a diario
 * (Vercel Cron) con `Authorization: Bearer $CRON_SECRET`. Solo avisa a quien tenga
 * esa hora elegida en Ajustes, y una sola vez por hora.
 */
async function handle(req: Request) {
  const secret = process.env.CRON_SECRET;
  const token = bearer(req);
  if (!secret || !token || !safeEqual(token, secret)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const now = new Date();
  const date = localDate(now);
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Europe/Madrid" }).format(now));
  const db = await getDb();
  const users = await db.select().from(schema.users);
  const results: Record<string, string> = {};

  for (const u of users) {
    const prefs = await getPrefs(u.id);
    const d = await getDashboard(u, now);
    const pending = d.me.dueToday - d.me.doneToday;
    if (!shouldRemind(prefs, date, hour, pending)) {
      results[u.id] = "nada";
      continue;
    }
    const { title, body } = reminderText({ pending, mine: d.me.today, theirs: d.partner?.today ?? 0, partner: d.partner?.name ?? null, streak: d.me.streak });
    const sent = await sendToUser(u.id, { title, body, url: "/", tag: "recordatorio" });
    await savePrefs(u.id, { ...prefs, lastSent: slotKey(date, hour) });
    results[u.id] = `enviado a ${sent} dispositivo(s)`;
  }
  return NextResponse.json({ date, hour, results });
}

export const GET = handle;
export const POST = handle;
