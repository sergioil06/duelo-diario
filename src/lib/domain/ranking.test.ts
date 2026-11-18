import { describe, expect, it } from "vitest";
import { periodStart, standings, weeklyResults, winStreak, winsByUser } from "./ranking";
import { evaluateAchievements, type PlayerStats } from "./achievements";
import { bucketKeys, pointsByCategory, pointsSeries } from "./stats";
import type { LedgerCompletion } from "./points";

const c = (userId: string, date: string, points: number, status: LedgerCompletion["status"] = "approved"): LedgerCompletion => ({
  userId, date, points, coins: points, status,
});

const today = "2026-11-18"; // miércoles

describe("clasificación", () => {
  const ledger = [
    c("a", "2026-11-18", 30), c("b", "2026-11-18", 10), c("b", "2026-11-17", 50),
    c("a", "2026-11-02", 100), c("b", "2026-10-30", 40), c("a", "2026-11-18", 99, "pending"),
  ];
  it("calcula el inicio de cada periodo", () => {
    expect(periodStart("day", today)).toBe("2026-11-18");
    expect(periodStart("week", today)).toBe("2026-11-16");
    expect(periodStart("month", today)).toBe("2026-11-01");
    expect(periodStart("all", today)).toBeNull();
  });
  it("ordena por puntos e ignora pendientes", () => {
    expect(standings(ledger, ["a", "b"], "2026-11-18")).toEqual([
      { userId: "a", points: 30, missions: 1 },
      { userId: "b", points: 10, missions: 1 },
    ]);
    expect(standings(ledger, ["a", "b"], "2026-11-16")[0].userId).toBe("b");
    expect(standings(ledger, ["a", "b"], null).map((s) => s.points)).toEqual([130, 100]);
  });
});

describe("ganador semanal", () => {
  it("cierra solo semanas terminadas, de la más reciente a la más antigua", () => {
    const ledger = [
      c("a", "2026-11-03", 50), c("b", "2026-11-04", 20), // semana del 2: gana a
      c("b", "2026-11-10", 60), c("a", "2026-11-11", 10), // semana del 9: gana b
      c("a", "2026-11-18", 500), // semana actual: no cuenta
    ];
    const r = weeklyResults(ledger, ["a", "b"], today);
    expect(r.map((w) => [w.weekStart, w.winner])).toEqual([["2026-11-09", "b"], ["2026-11-02", "a"]]);
    expect(winsByUser(r)).toEqual({ a: 1, b: 1 });
    expect(winStreak(r, "b")).toBe(1);
    expect(winStreak(r, "a")).toBe(0);
  });
  it("empate o semana vacía no tiene ganador", () => {
    const r = weeklyResults([c("a", "2026-11-02", 20), c("b", "2026-11-03", 20)], ["a", "b"], today);
    expect(r).toHaveLength(2);
    expect(r.every((w) => w.winner === null)).toBe(true);
  });
  it("sin historial no hay semanas", () => {
    expect(weeklyResults([], ["a", "b"], today)).toEqual([]);
  });
});

describe("logros", () => {
  const empty: PlayerStats = {
    totalPoints: 0, missionsDone: 0, bestStreak: 0, weeklyWins: 0, winStreak: 0,
    challengesDone: 0, perfectDays: 0, validationsGiven: 0, byCategory: {}, maxStepsDay: 0,
  };
  it("desbloquea por umbral y muestra progreso limitado al objetivo", () => {
    const s = evaluateAchievements({ ...empty, missionsDone: 60, bestStreak: 7, byCategory: { deporte: 12 } });
    const get = (id: string) => s.find((a) => a.def.id === id)!;
    expect(get("missions-1").unlocked).toBe(true);
    expect(get("missions-50").unlocked).toBe(true);
    expect(get("missions-250")).toMatchObject({ unlocked: false, current: 60 });
    expect(get("streak-7").unlocked).toBe(true);
    expect(get("sport-30")).toMatchObject({ unlocked: false, current: 12 });
    expect(get("missions-1").current).toBe(1);
  });
  it("los ids son únicos", () => {
    const ids = evaluateAchievements(empty).map((a) => a.def.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("estadísticas", () => {
  it("genera cubos de día, semana y mes acabando en el actual", () => {
    expect(bucketKeys("day", today, 3)).toEqual(["2026-11-16", "2026-11-17", "2026-11-18"]);
    expect(bucketKeys("week", today, 2)).toEqual(["2026-11-09", "2026-11-16"]);
    expect(bucketKeys("month", "2026-01-10", 3)).toEqual(["2025-11-01", "2025-12-01", "2026-01-01"]);
  });
  it("suma puntos aprobados por cubo y deja a cero los vacíos", () => {
    const s = pointsSeries([c("a", "2026-11-17", 10), c("a", "2026-11-17", 5), c("b", "2026-11-18", 7), c("a", "2026-11-18", 9, "rejected")], ["a", "b"], "day", today, 3);
    expect(s.map((p) => p.values)).toEqual([{ a: 0, b: 0 }, { a: 15, b: 0 }, { a: 0, b: 7 }]);
    expect(s[2].label).toBe("X 18");
  });
  it("agrupa por categoría ordenando por total", () => {
    const r = pointsByCategory(
      [{ ...c("a", today, 10), category: "hogar" }, { ...c("b", today, 30), category: "deporte" }, { ...c("a", today, 5), category: "deporte" }],
      ["a", "b"],
    );
    expect(r).toEqual([
      { category: "deporte", values: { a: 5, b: 30 } },
      { category: "hogar", values: { a: 10, b: 0 } },
    ]);
  });
});
