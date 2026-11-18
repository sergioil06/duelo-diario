import "server-only";
import { like } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import type { User } from "@/lib/db/schema";
import { localDate } from "@/lib/domain/dates";
import { evaluateAchievements, type PlayerStats } from "@/lib/domain/achievements";
import { isAssignedTo, isScheduledOn } from "@/lib/domain/missions";
import { periodStart, standings, weeklyResults, winStreak, winsByUser, type Period } from "@/lib/domain/ranking";
import { pointsByCategory, pointsSeries } from "@/lib/domain/stats";
import { bestStreak } from "@/lib/domain/streak";

const { users, missions, completions, stepLogs, settings } = schema;

async function loadAll() {
  const db = await getDb();
  const [u, m, c, s, b] = await Promise.all([
    db.select().from(users).orderBy(users.createdAt),
    db.select().from(missions),
    db.select().from(completions),
    db.select().from(stepLogs),
    db.select().from(settings).where(like(settings.key, "bet:%")),
  ]);
  return { users: u, missions: m, completions: c, steps: s, bets: new Map(b.map((r) => [r.key.slice(4), String(r.value)])) };
}

export async function getLeaderboard(me: User, now = new Date()) {
  const data = await loadAll();
  const today = localDate(now);
  const ids = [me.id, ...data.users.filter((u) => u.id !== me.id).map((u) => u.id)];
  const names = Object.fromEntries(data.users.map((u) => [u.id, u.displayName]));
  const looks = Object.fromEntries(data.users.map((u) => [u.id, u.role === "admin" ? "cap" : "bow"] as const));
  const periods = (["day", "week", "month", "all"] as Period[]).map((p) => ({
    period: p,
    standings: standings(data.completions, ids, periodStart(p, today)),
  }));
  const weeks = weeklyResults(data.completions, ids, today).map((w) => ({ ...w, bet: data.bets.get(w.weekStart) ?? null }));
  return { me: me.id, ids, names, looks, periods, weeks, wins: winsByUser(weeks) };
}

export async function getAchievements(me: User, now = new Date()) {
  const data = await loadAll();
  const today = localDate(now);
  const ids = [me.id, ...data.users.filter((u) => u.id !== me.id).map((u) => u.id)];
  const weeks = weeklyResults(data.completions, ids, today);
  const wins = winsByUser(weeks);
  const mById = new Map(data.missions.map((m) => [m.id, m]));

  const statsFor = (userId: string): PlayerStats => {
    const mine = data.completions.filter((c) => c.userId === userId);
    const approved = mine.filter((c) => c.status === "approved");
    const byCategory: Record<string, number> = {};
    for (const c of approved) {
      const cat = mById.get(c.missionId)?.category;
      if (cat) byCategory[cat] = (byCategory[cat] ?? 0) + 1;
    }
    // Día perfecto: todas las misiones diarias o de días concretos que le tocaban, aprobadas.
    const byDate = new Map<string, Set<string>>();
    for (const c of approved) byDate.set(c.date, (byDate.get(c.date) ?? new Set()).add(c.missionId));
    let perfectDays = 0;
    for (const [date, done] of byDate) {
      const due = data.missions.filter(
        (m) => m.active && !m.isChallenge && m.frequency.type !== "weekly" && isAssignedTo(m, userId) && isScheduledOn(m, date),
      );
      if (due.length > 0 && due.every((m) => done.has(m.id))) perfectDays++;
    }
    return {
      totalPoints: approved.reduce((s, c) => s + c.points, 0),
      missionsDone: approved.length,
      bestStreak: bestStreak(mine.filter((c) => c.status !== "rejected").map((c) => c.date)),
      weeklyWins: wins[userId] ?? 0,
      winStreak: winStreak(weeks, userId),
      challengesDone: approved.filter((c) => mById.get(c.missionId)?.isChallenge && c.points > 0).length,
      perfectDays,
      validationsGiven: data.completions.filter((c) => c.validatedBy === userId).length,
      byCategory,
      maxStepsDay: Math.max(0, ...data.steps.filter((s) => s.userId === userId).map((s) => s.steps)),
    };
  };

  return ids.map((id) => {
    const stats = statsFor(id);
    return {
      userId: id,
      name: data.users.find((u) => u.id === id)!.displayName,
      stats,
      achievements: evaluateAchievements(stats),
    };
  });
}

export async function getStats(me: User, now = new Date()) {
  const data = await loadAll();
  const today = localDate(now);
  const ids = [me.id, ...data.users.filter((u) => u.id !== me.id).map((u) => u.id)];
  const cat = new Map(data.missions.map((m) => [m.id, m.category]));
  return {
    ids,
    names: Object.fromEntries(data.users.map((u) => [u.id, u.displayName])),
    series: {
      day: pointsSeries(data.completions, ids, "day", today, 14),
      week: pointsSeries(data.completions, ids, "week", today, 8),
      month: pointsSeries(data.completions, ids, "month", today, 6),
    },
    byCategory: pointsByCategory(
      data.completions.map((c) => ({ ...c, category: cat.get(c.missionId) ?? "otras" })),
      ids,
    ),
    recent: data.completions
      .filter((c) => c.status !== "rejected")
      .sort((a, b) => (a.date === b.date ? +b.createdAt - +a.createdAt : a.date < b.date ? 1 : -1))
      .slice(0, 15)
      .map((c) => ({
        id: c.id,
        date: c.date,
        userId: c.userId,
        title: data.missions.find((m) => m.id === c.missionId)?.title ?? "Misión borrada",
        points: c.points,
        status: c.status,
      })),
  };
}
