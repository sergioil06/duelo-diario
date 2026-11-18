import { describe, expect, it } from "vitest";
import { normalizePrefs, reminderText, shouldRemind, slotKey } from "./notify";

describe("avisos", () => {
  it("normaliza preferencias raras o vacías", () => {
    expect(normalizePrefs(null)).toEqual({ hours: [20], partnerActivity: true, lastSent: undefined });
    expect(normalizePrefs({ hours: [22, 9, 9, 25, 1.5, -1], partnerActivity: false }).hours).toEqual([9, 22]);
    expect(normalizePrefs({ partnerActivity: "sí" }).partnerActivity).toBe(true);
  });
  it("solo recuerda a las horas elegidas, una vez y si queda algo", () => {
    const p = normalizePrefs({ hours: [20] });
    expect(shouldRemind(p, "2026-11-18", 20, 2)).toBe(true);
    expect(shouldRemind(p, "2026-11-18", 19, 2)).toBe(false);
    expect(shouldRemind(p, "2026-11-18", 20, 0)).toBe(false);
    expect(shouldRemind({ ...p, lastSent: slotKey("2026-11-18", 20) }, "2026-11-18", 20, 2)).toBe(false);
    expect(shouldRemind({ ...p, lastSent: slotKey("2026-11-17", 20) }, "2026-11-18", 20, 2)).toBe(true);
  });
  it("el texto pica según el marcador y la racha", () => {
    expect(reminderText({ pending: 1, mine: 10, theirs: 40, partner: "Lucía", streak: 0 })).toEqual({
      title: "Te queda 1 misión hoy",
      body: "Lucía te saca 30 puntos. ¡Aún puedes remontar!",
    });
    const t = reminderText({ pending: 3, mine: 50, theirs: 20, partner: "Lucía", streak: 5 });
    expect(t.title).toBe("Te quedan 3 misiones hoy");
    expect(t.body).toContain("Vas ganando");
    expect(t.body).toContain("racha de 5 días");
  });
});
