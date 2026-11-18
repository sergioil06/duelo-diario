import { sql } from "drizzle-orm";
import type { DB } from "./db/connect";
import { missions } from "./db/schema";

/** Misiones de ejemplo, solo si aún no hay ninguna. Devuelve cuántas creó. */
export async function seedMissions(db: DB, createdBy: string): Promise<number> {
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(missions);
  if (count > 0) return 0;
  const rows: (typeof missions.$inferInsert)[] = [
    { title: "Ir al gimnasio", icon: "gym", category: "deporte", points: 30, frequency: { type: "weekdays", days: [1, 3, 5] } },
    { title: "10.000 pasos", icon: "steps", category: "deporte", points: 20, frequency: { type: "daily" }, kind: "steps", target: 10000 },
    { title: "Ordenar la casa", icon: "house", category: "hogar", points: 15, frequency: { type: "daily" }, requiresValidation: true },
    { title: "Beber 2 L de agua", icon: "water", category: "salud", points: 10, frequency: { type: "daily" } },
    { title: "Leer 20 minutos", icon: "book", category: "mente", points: 15, frequency: { type: "daily" } },
    { title: "Dormir 8 horas", icon: "sleep", category: "salud", points: 15, frequency: { type: "daily" } },
    { title: "Cocinar sano", icon: "cook", category: "salud", points: 20, frequency: { type: "weekly", times: 3 } },
    { title: "Reto: gimnasio 3 días", icon: "trophy", category: "reto", points: 100, frequency: { type: "weekly", times: 3 }, isChallenge: true },
  ];
  await db.insert(missions).values(rows.map((r) => ({ ...r, createdBy })));
  return rows.length;
}
