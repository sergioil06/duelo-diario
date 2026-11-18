import { describe, expect, it } from "vitest";
import {
  CATALOG, RARITIES, checkPurchase, cleanEquipped, defaultAppearance, equip, sanitizeAppearance,
} from "./shop";
import { coinBalance, rankingPoints, type LedgerCompletion } from "./points";

describe("catálogo", () => {
  it("ids únicos y precios escalonados por rareza", () => {
    expect(new Set(CATALOG.map((i) => i.id)).size).toBe(CATALOG.length);
    const order = ["comun", "rara", "epica", "legendaria"] as const;
    for (let i = 1; i < order.length; i++) expect(RARITIES[order[i]].base).toBeGreaterThan(RARITIES[order[i - 1]].base);
    for (const item of CATALOG) expect(item.price).toBe(RARITIES[item.rarity].base);
  });
  it("hay de todo: cada hueco tiene al menos un objeto", () => {
    const slots = new Set(CATALOG.map((i) => i.slot));
    expect([...slots].sort()).toEqual(["background", "effect", "glasses", "hat", "outfit", "pet", "pose"]);
  });
});

describe("comprar", () => {
  it("se puede si tienes monedas y no lo tienes ya", () => {
    expect(checkPurchase("hat-cap", [], 60)).toEqual({ ok: true, price: 60 });
  });
  it("no se puede sin monedas, repetido o si no existe", () => {
    expect(checkPurchase("hat-crown", [], 100)).toEqual({ ok: false, reason: "Te faltan 1100 monedas" });
    expect(checkPurchase("hat-cap", ["hat-cap"], 999)).toEqual({ ok: false, reason: "Ya lo tienes" });
    expect(checkPurchase("nada", [], 999).ok).toBe(false);
  });
  it("comprar resta monedas pero nunca puntos de ranking", () => {
    const ledger: LedgerCompletion[] = [{ userId: "a", date: "2026-11-18", status: "approved", points: 500, coins: 500 }];
    const spends = [{ userId: "a", coins: 450 }];
    expect(coinBalance(ledger, spends, "a")).toBe(50);
    expect(rankingPoints(ledger, "a")).toBe(500);
  });
});

describe("vestidor", () => {
  it("equipa y quita objetos propios en su hueco", () => {
    const e = equip({}, "hat", "hat-cap", ["hat-cap"]);
    expect(e).toEqual({ hat: "hat-cap" });
    expect(equip(e, "hat", null, [])).toEqual({});
  });
  it("no deja equipar lo que no tienes ni en el hueco equivocado", () => {
    expect(() => equip({}, "hat", "hat-cap", [])).toThrow("comprarlo");
    expect(() => equip({}, "glasses", "hat-cap", ["hat-cap"])).toThrow("hueco");
  });
  it("limpia equipados que ya no son válidos", () => {
    expect(cleanEquipped({ hat: "hat-cap", pet: "pet-cat", glasses: "fuera" }, ["hat-cap"])).toEqual({ hat: "hat-cap" });
  });
  it("la apariencia solo admite valores de la lista", () => {
    const def = defaultAppearance("a");
    const clean = sanitizeAppearance({ skin: "#000000", hairStyle: "long", eyes: "<script>" as never }, def);
    expect(clean).toEqual({ ...def, hairStyle: "long" });
  });
});
