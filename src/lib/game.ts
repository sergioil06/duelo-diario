import "server-only";
import { and, eq, gte, ne, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import type { User } from "@/lib/db/schema";
import { localDate, monthStart, weekStart } from "@/lib/domain/dates";
import { canComplete, missionsForDay, type MissionDef } from "@/lib/domain/missions";
import { awardFor, rankingPoints, coinBalance, type LedgerCompletion } from "@/lib/domain/points";
import { currentStreak, nextTier, streakMultiplier } from "@/lib/domain/streak";
import { getAvatar } from "@/lib/shop-server";
import { onCompleted } from "@/lib/events";

const { users, missions, completions, stepLogs, settings, purchases } = schema;

import { GameError } from "@/lib/errors";
export { GameError };

function toDef(m: typeof missions.$inferSelect): MissionDef {
  return { ...m, kind: m.kind as MissionDef["kind"] };
}

export async function getPartner(userId: string) {
  const db = await getDb();
  const [p] = await db.select().from(users).where(ne(users.id, userId));
  return p ?? null;
}

async function activeDates(userId: string): Promise<string[]> {
  const db = await getDb();
  const rows = await db
    .selectDistinct({ date: completions.date })
    .from(completions)
    .where(and(eq(completions.userId, userId), ne(completions.status, "rejected")));
  return rows.map((r) => r.date);
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const db = await getDb();
  const [row] = await db.select().from(settings).where(eq(settings.key, key));
  return (row?.value as T) ?? fallback;
}

export async function setSetting(key: string, value: unknown) {
  const db = await getDb();
  await db.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } });
}

export interface PlayerSummary {
  id: string;
  name: string;
  /** Muñeco provisional: el admin lleva gorra, la otra cuenta lazo. */
  look: "cap" | "bow";
  today: number;
  week: number;
  month: number;
  total: number;
  streak: number;
  multiplier: number;
  coins: number;
  doneToday: number;
  dueToday: number;
}

export async function getDashboard(me: User, now = new Date()) {
  const db = await getDb();
  const today = localDate(now);
  const partner = await getPartner(me.id);
  const [allMissions, allCompletions, allPurchases] = await Promise.all([
    db.select().from(missions).orderBy(missions.createdAt),
    db.select().from(completions),
    db.select().from(purchases),
  ]);
  const spends = allPurchases.map((p) => ({ userId: p.userId, coins: p.price }));
  const defs = allMissions.map(toDef);
  const ledger: LedgerCompletion[] = allCompletions;
  const wk = weekStart(today);
  const mo = monthStart(today);

  const summarize = async (u: User): Promise<PlayerSummary> => {
    const states = missionsForDay(defs, allCompletions, u.id, today).filter((s) => !s.mission.isChallenge);
    const streak = currentStreak(await activeDates(u.id), today);
    return {
      id: u.id,
      name: u.displayName,
      look: u.role === "admin" ? "cap" : "bow",
      today: rankingPoints(ledger, u.id, (d) => d === today),
      week: rankingPoints(ledger, u.id, (d) => d >= wk),
      month: rankingPoints(ledger, u.id, (d) => d >= mo),
      total: rankingPoints(ledger, u.id),
      streak,
      multiplier: streakMultiplier(streak),
      coins: coinBalance(ledger, spends, u.id),
      doneToday: states.filter((s) => s.today === "approved" || s.today === "pending").length,
      dueToday: states.length,
    };
  };

  const myStates = missionsForDay(defs, allCompletions, me.id, today);
  const missionsToday = myStates
    .filter((s) => !s.mission.isChallenge)
    .map((s) => ({ ...s, canComplete: canComplete(s) }));
  const challenges = defs
    .filter((m) => m.active && m.isChallenge && (m.assignee === "both" || m.assignee === me.id))
    .map((m) => {
      const s = missionsForDay([m], allCompletions, me.id, today)[0];
      const weekCount = allCompletions.filter(
        (c) => c.missionId === m.id && c.userId === me.id && c.status !== "rejected" && c.date >= wk,
      ).length;
      return { mission: m, weekCount, target: m.frequency.type === "weekly" ? m.frequency.times : 1, canComplete: s ? canComplete(s) : false, today: s?.today ?? null };
    });

  const toValidate = partner
    ? allCompletions
        .filter((c) => c.userId === partner.id && c.status === "pending")
        .map((c) => ({ ...c, mission: defs.find((m) => m.id === c.missionId)! }))
        .filter((c) => c.mission)
    : [];

  const [stepsRow] = await db
    .select()
    .from(stepLogs)
    .where(and(eq(stepLogs.userId, me.id), eq(stepLogs.date, today)));

  const meSummary = await summarize(me);
  return {
    today,
    avatars: { me: await getAvatar(me), partner: partner ? await getAvatar(partner) : null },
    me: meSummary,
    partner: partner ? await summarize(partner) : null,
    nextTier: nextTier(meSummary.streak),
    missionsToday,
    challenges,
    toValidate,
    stepsToday: stepsRow?.steps ?? 0,
    bet: await getSetting<string>(`bet:${weekStart(today)}`, ""),
  };
}

export type Dashboard = Awaited<ReturnType<typeof getDashboard>>;

export async function completeMission(me: User, missionId: string, now = new Date(), opts: { source?: "steps" } = {}) {
  const db = await getDb();
  const today = localDate(now);
  const [m] = await db.select().from(missions).where(eq(missions.id, missionId));
  if (!m || !m.active) throw new GameError("Esa misión no existe");
  const def = toDef(m);
  if (def.kind === "steps" && opts.source !== "steps") throw new GameError("Esta misión se completa registrando los pasos");
  const mine = await db
    .select()
    .from(completions)
    .where(and(eq(completions.missionId, missionId), eq(completions.userId, me.id)));
  const [state] = missionsForDay([def], mine, me.id, today);
  if (!state) throw new GameError("Esta misión no te toca hoy");
  if (!canComplete(state)) throw new GameError("Ya la has completado");

  const dates = new Set(await activeDates(me.id));
  dates.add(today);
  const streakAfter = currentStreak(dates, today);
  const award = awardFor(def, streakAfter, state.weekCount + 1);
  const status = def.requiresValidation ? "pending" : "approved";
  const values = {
    missionId,
    userId: me.id,
    date: today,
    status,
    points: award.points,
    coins: award.coins,
    multiplier: award.multiplier,
    validatedBy: null,
  } as const;
  const [row] = await db
    .insert(completions)
    .values(values)
    .onConflictDoUpdate({ target: [completions.missionId, completions.userId, completions.date], set: values })
    .returning();
  return { completion: row, award, status, streak: streakAfter, title: m.title };
}

/** Deshacer el completado de hoy (por si le diste sin querer). */
export async function undoMission(me: User, missionId: string, now = new Date()) {
  const db = await getDb();
  await db
    .delete(completions)
    .where(
      and(eq(completions.missionId, missionId), eq(completions.userId, me.id), eq(completions.date, localDate(now))),
    );
}

export async function validateCompletion(me: User, completionId: string, approve: boolean) {
  const db = await getDb();
  const [c] = await db.select().from(completions).where(eq(completions.id, completionId));
  if (!c || c.status !== "pending") throw new GameError("No hay nada que validar");
  if (c.userId === me.id) throw new GameError("No puedes validar tus propias misiones");
  await db
    .update(completions)
    .set({ status: approve ? "approved" : "rejected", validatedBy: me.id })
    .where(eq(completions.id, completionId));
  const [m] = await db.select({ title: missions.title }).from(missions).where(eq(missions.id, c.missionId));
  return { userId: c.userId, points: c.points, title: m?.title ?? "una misión" };
}

/** Registra pasos del día y completa las misiones de pasos cuyo objetivo se alcance. */
export async function logSteps(me: User, steps: number, source = "manual", now = new Date()) {
  if (!Number.isInteger(steps) || steps < 0 || steps > 200_000) throw new GameError("Número de pasos no válido");
  const db = await getDb();
  const today = localDate(now);
  await db
    .insert(stepLogs)
    .values({ userId: me.id, date: today, steps, source })
    .onConflictDoUpdate({
      target: [stepLogs.userId, stepLogs.date],
      set: { steps: sql`greatest(${stepLogs.steps}, ${steps})`, source, updatedAt: new Date() },
    });
  const stepMissions = await db
    .select()
    .from(missions)
    .where(and(eq(missions.kind, "steps"), eq(missions.active, true), gte(missions.target, 0)));
  const completed: string[] = [];
  for (const m of stepMissions) {
    if (m.target === null || steps < m.target) continue;
    try {
      const r = await completeMission(me, m.id, now, { source: "steps" });
      completed.push(m.title);
      onCompleted(me, r.title, r.award.points, r.status === "pending");
    } catch (e) {
      if (!(e instanceof GameError)) throw e;
    }
  }
  return { completed };
}
