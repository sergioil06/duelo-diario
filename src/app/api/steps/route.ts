import { NextResponse } from "next/server";
import { isNotNull } from "drizzle-orm";
import { bearer, safeEqual } from "@/lib/auth/bearer";
import { getDb, schema } from "@/lib/db";
import { GameError, logSteps } from "@/lib/game";

export const dynamic = "force-dynamic";

/**
 * Recibe los pasos del día desde un Atajo de iOS (o cualquier automatización).
 *   POST /api/steps
 *   Authorization: Bearer <tu token de Ajustes>
 *   {"steps": 10450}
 */
export async function POST(req: Request) {
  const token = bearer(req);
  if (!token || token.length < 20) return NextResponse.json({ error: "Falta el token" }, { status: 401 });
  const db = await getDb();
  const candidates = await db.select().from(schema.users).where(isNotNull(schema.users.stepsToken));
  const user = candidates.find((u) => u.stepsToken && safeEqual(u.stepsToken, token));
  if (!user) return NextResponse.json({ error: "Token no válido" }, { status: 401 });

  let steps: number;
  try {
    const text = await req.text();
    if (text.length > 2000) throw new Error("demasiado grande");
    const parsed = text.trim().startsWith("{") ? JSON.parse(text).steps : text;
    // El Atajo puede mandar "10450,0" o "10.450" según el idioma del iPhone.
    steps = Math.floor(Number(String(parsed).replace(/[.\s]/g, "").replace(",", ".")));
  } catch {
    return NextResponse.json({ error: "Cuerpo no válido. Envía {\"steps\": 1234}" }, { status: 400 });
  }
  try {
    const r = await logSteps(user, steps, "atajo");
    return NextResponse.json({ ok: true, steps, completed: r.completed });
  } catch (e) {
    if (e instanceof GameError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
}
