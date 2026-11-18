import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Diagnóstico del despliegue: solo dice qué está configurado, nunca los valores. */
export async function GET() {
  const env = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    SESSION_SECRET: (process.env.SESSION_SECRET?.length ?? 0) >= 32,
    VAPID: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && !!process.env.VAPID_PRIVATE_KEY,
    CRON_SECRET: !!process.env.CRON_SECRET,
  };
  let db: string;
  let users: number | null = null;
  try {
    const d = await getDb();
    const r = (await d.execute(sql`select count(*)::int as n from users`)) as unknown as { rows?: { n: number }[] } & { n: number }[];
    users = (r.rows ?? r)[0]?.n ?? 0;
    db = "ok";
  } catch (e) {
    const err = e as { code?: string; message?: string };
    db = `error ${err.code ?? ""} ${(err.message ?? "").replace(/postgres(ql)?:\/\/\S+/g, "[url]").slice(0, 160)}`.trim();
  }
  return NextResponse.json({ env, db, users }, { headers: { "Cache-Control": "no-store" } });
}
