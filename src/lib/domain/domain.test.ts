import { describe, expect, it } from "vitest";
import { addDays, isoWeekday, localDate, weekStart } from "./dates";
import { canComplete, missionsForDay, type CompletionRef, type MissionDef } from "./missions";
import { bestStreak, currentStreak, nextTier, streakMultiplier } from "./streak";
import { awardFor, coinBalance, rankingPoints, type LedgerCompletion } from "./points";

const base: MissionDef = {
  id: "m1",
  title: "Gimnasio",
  icon: "gym",
  category: "deporte",
  points: 30,
  frequency: { type: "daily" },
  assignee: "both",
  requiresValidation: false,
  kind: "check",
  target: null,
  isChallenge: false,
  active: true,
};

describe("fechas en Europe/Madrid", () => {
  it("a las 23:30 UTC ya es el día siguiente en Madrid (invierno, UTC+1)", () => {
    expect(localDate(new Date("2026-11-18T23:30:00Z"))).toBe("2026-11-19");
  });
  it("a las 21:59 UTC en verano aún es el mismo día (UTC+2)", () => {
    expect(localDate(new Date("2026-07-01T21:59:00Z"))).toBe("2026-07-01");
    expect(localDate(new Date("2026-07-01T22:00:00Z"))).toBe("2026-07-02");
  });
  it("calcula lunes y día de la semana", () => {
    expect(isoWeekday("2026-11-18")).toBe(3); // miércoles
    expect(weekStart("2026-11-18")).toBe("2026-11-16");
    expect(weekStart("2026-11-22")).toBe("2026-11-16"); // domingo
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("rachas", () => {
  it("cuenta días seguidos hasta hoy", () => {
    expect(currentStreak(["2026-11-16", "2026-11-17", "2026-11-18"], "2026-11-18")).toBe(3);
  });
  it("si hoy aún no hay nada, la racha de ayer sigue viva", () => {
    expect(currentStreak(["2026-11-16", "2026-11-17"], "2026-11-18")).toBe(2);
  });
  it("un hueco rompe la racha", () => {
    expect(currentStreak(["2026-11-15", "2026-11-17", "2026-11-18"], "2026-11-18")).toBe(2);
    expect(currentStreak(["2026-11-15"], "2026-11-18")).toBe(0);
  });
  it("mejor racha histórica", () => {
    expect(bestStreak(["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-10", "2026-11-11"])).toBe(3);
    expect(bestStreak([])).toBe(0);
  });
  it("multiplicador por tramos", () => {
    expect(streakMultiplier(0)).toBe(1);
    expect(streakMultiplier(2)).toBe(1);
    expect(streakMultiplier(3)).toBe(1.1);
    expect(streakMultiplier(7)).toBe(1.25);
    expect(streakMultiplier(14)).toBe(1.5);
    expect(streakMultiplier(100)).toBe(2);
    expect(nextTier(5)).toEqual({ inDays: 2, multiplier: 1.25 });
    expect(nextTier(30)).toBeNull();
  });
});

describe("puntos y monedas", () => {
  it("aplica el multiplicador de racha y redondea", () => {
    expect(awardFor(base, 1)).toEqual({ points: 30, coins: 30, multiplier: 1 });
    expect(awardFor({ ...base, points: 15 }, 7)).toEqual({ points: 19, coins: 19, multiplier: 1.25 });
  });
  it("un reto semanal solo paga al completarse y sin multiplicador", () => {
    const reto = { ...base, points: 100, isChallenge: true, frequency: { type: "weekly", times: 3 } as const };
    expect(awardFor(reto, 20, 2).points).toBe(0);
    expect(awardFor(reto, 20, 3)).toEqual({ points: 100, coins: 100, multiplier: 1 });
  });
  it("gastar monedas no resta puntos de ranking", () => {
    const ledger: LedgerCompletion[] = [
      { userId: "a", date: "2026-11-18", status: "approved", points: 30, coins: 30 },
      { userId: "a", date: "2026-11-17", status: "approved", points: 20, coins: 20 },
    ];
    const spends = [{ userId: "a", coins: 40 }];
    expect(rankingPoints(ledger, "a")).toBe(50);
    expect(coinBalance(ledger, spends, "a")).toBe(10);
  });
  it("las pendientes de validar y las rechazadas no suman", () => {
    const ledger: LedgerCompletion[] = [
      { userId: "a", date: "2026-11-18", status: "pending", points: 30, coins: 30 },
      { userId: "a", date: "2026-11-18", status: "rejected", points: 10, coins: 10 },
      { userId: "b", date: "2026-11-18", status: "approved", points: 5, coins: 5 },
    ];
    expect(rankingPoints(ledger, "a")).toBe(0);
    expect(coinBalance(ledger, [], "a")).toBe(0);
    expect(rankingPoints(ledger, "b", (d) => d === "2026-11-18")).toBe(5);
  });
});

describe("misiones del día", () => {
  const today = "2026-11-18"; // miércoles
  it("filtra por asignación y días concretos", () => {
    const ms: MissionDef[] = [
      { ...base, id: "solo-a", assignee: "a" },
      { ...base, id: "solo-b", assignee: "b" },
      { ...base, id: "lunes", frequency: { type: "weekdays", days: [1] } },
      { ...base, id: "miercoles", frequency: { type: "weekdays", days: [3, 5] } },
      { ...base, id: "inactiva", active: false },
    ];
    expect(missionsForDay(ms, [], "a", today).map((s) => s.mission.id)).toEqual(["solo-a", "miercoles"]);
  });
  it("una semanal desaparece al cumplir el cupo, salvo el día que se completó", () => {
    const m = { ...base, id: "w", frequency: { type: "weekly", times: 2 } as const };
    const done: CompletionRef[] = [
      { missionId: "w", userId: "a", date: "2026-11-16", status: "approved" },
      { missionId: "w", userId: "a", date: "2026-11-17", status: "approved" },
    ];
    expect(missionsForDay([m], done, "a", today)).toHaveLength(0);
    const states = missionsForDay([m], done, "a", "2026-11-17");
    expect(states).toHaveLength(1);
    expect(canComplete(states[0])).toBe(false);
    // La semana siguiente vuelve a aparecer.
    expect(missionsForDay([m], done, "a", "2026-11-23")).toHaveLength(1);
  });
  it("una rechazada se puede volver a completar; una pendiente no", () => {
    const rejected = missionsForDay([base], [{ missionId: "m1", userId: "a", date: today, status: "rejected" }], "a", today);
    expect(canComplete(rejected[0])).toBe(true);
    const pending = missionsForDay([base], [{ missionId: "m1", userId: "a", date: today, status: "pending" }], "a", today);
    expect(canComplete(pending[0])).toBe(false);
  });
  it("una diaria hecha ayer se puede volver a hacer hoy (reinicio a medianoche)", () => {
    const s = missionsForDay([base], [{ missionId: "m1", userId: "a", date: "2026-11-17", status: "approved" }], "a", today);
    expect(s[0].today).toBeNull();
    expect(canComplete(s[0])).toBe(true);
    const wd = { ...base, frequency: { type: "weekdays", days: [1, 3] } as const };
    const s2 = missionsForDay([wd], [{ missionId: "m1", userId: "a", date: "2026-11-16", status: "approved" }], "a", today);
    expect(canComplete(s2[0])).toBe(true);
  });
  it("lo que hizo la pareja no cuenta como mío", () => {
    const s = missionsForDay([base], [{ missionId: "m1", userId: "b", date: today, status: "approved" }], "a", today);
    expect(s[0].today).toBeNull();
    expect(canComplete(s[0])).toBe(true);
  });
});
