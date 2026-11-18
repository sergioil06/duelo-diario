/**
 * Rellena 5 semanas de historial inventado para probar el ranking y las gráficas.
 * SOLO para desarrollo: se niega a correr contra una DATABASE_URL.
 *
 *   npm run demo
 */
import { and, eq, ne } from "drizzle-orm";
import { createDb } from "../src/lib/db/connect";
import { completions, missions, settings, users } from "../src/lib/db/schema";
import { addDays, localDate, weekStart } from "../src/lib/domain/dates";
import { isAssignedTo, isScheduledOn } from "../src/lib/domain/missions";

async function main() {
  if (process.env.DATABASE_URL) throw new Error("demo solo funciona con la base de datos local (sin DATABASE_URL)");
  const db = await createDb();
  const us = await db.select().from(users);
  const ms = (await db.select().from(missions)).filter((m) => !m.isChallenge && m.frequency.type !== "weekly");
  const today = localDate();
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  let n = 0;
  for (let d = 35; d >= 1; d--) {
    const date = addDays(today, -d);
    for (const [i, u] of us.entries()) {
      // Cada semana va mejor uno distinto, para que el historial tenga de todo.
      const ahead = Math.floor(d / 7) % 2 === i;
      const skill = ahead ? 0.72 : 0.6;
      for (const m of ms) {
        if (!isAssignedTo(m, u.id) || !isScheduledOn(m, date) || rand() > skill) continue;
        await db.insert(completions).values({ missionId: m.id, userId: u.id, date, status: "approved", points: m.points, coins: m.points, multiplier: 1 }).onConflictDoNothing();
        n++;
      }
    }
  }
  for (let w = 1; w <= 5; w++) {
    const ws = addDays(weekStart(today), -7 * w);
    const bets = ["Quien pierda invita a cenar", "Quien pierda friega una semana", "Quien pierda elige peli… no, la elige quien gana"];
    await db.insert(settings).values({ key: `bet:${ws}`, value: bets[w % bets.length] }).onConflictDoNothing();
  }
  // Una validación hecha por la pareja, para el logro de árbitro.
  const [first] = await db.select().from(completions).where(and(eq(completions.userId, us[0].id), ne(completions.date, today)));
  if (first) await db.update(completions).set({ validatedBy: us[1].id }).where(eq(completions.id, first.id));
  console.log(`✓ ${n} completados de ejemplo`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
