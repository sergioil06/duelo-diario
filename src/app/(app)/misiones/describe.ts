import type { Frequency } from "@/lib/domain/missions";

export const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

export function describeFrequency(f: Frequency): string {
  if (f.type === "daily") return "Cada día";
  if (f.type === "weekly") return f.times === 1 ? "1 vez por semana" : `${f.times} veces por semana`;
  return f.days.map((d) => WEEKDAYS[d - 1]).join(" ");
}
