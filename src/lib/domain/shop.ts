/**
 * Catálogo de la tienda. Los objetos están definidos en código (no en la base de
 * datos): cada uno dice en qué hueco va y cómo se dibuja en el avatar 3D.
 * Para añadir uno, añade una entrada aquí; el precio sale de su rareza si no se indica.
 */
export type Slot = "hat" | "glasses" | "outfit" | "pet" | "background" | "pose" | "effect";
export type Rarity = "comun" | "rara" | "epica" | "legendaria";

export const SLOTS: { id: Slot; label: string }[] = [
  { id: "hat", label: "Sombreros" },
  { id: "glasses", label: "Gafas" },
  { id: "outfit", label: "Ropa" },
  { id: "pet", label: "Mascotas" },
  { id: "background", label: "Escenarios" },
  { id: "pose", label: "Poses" },
  { id: "effect", label: "Efectos" },
];

export const RARITIES: Record<Rarity, { label: string; color: string; base: number }> = {
  comun: { label: "Común", color: "#64748B", base: 60 },
  rara: { label: "Rara", color: "#2563EB", base: 180 },
  epica: { label: "Épica", color: "#9333EA", base: 450 },
  legendaria: { label: "Legendaria", color: "#B45309", base: 1200 },
};

export interface ShopItem {
  id: string;
  name: string;
  slot: Slot;
  rarity: Rarity;
  price: number;
  /** Parámetros que entiende el renderizador 3D. */
  model: string;
  color: string;
  accent?: string;
}

type Def = Omit<ShopItem, "price"> & { price?: number };

const defs: Def[] = [
  // Sombreros
  { id: "hat-cap", name: "Gorra", slot: "hat", rarity: "comun", model: "cap", color: "#2563EB", accent: "#1E40AF" },
  { id: "hat-beanie", name: "Gorro de lana", slot: "hat", rarity: "comun", model: "beanie", color: "#DC2626", accent: "#FFFFFF" },
  { id: "hat-party", name: "Gorro de fiesta", slot: "hat", rarity: "rara", model: "party", color: "#EC4899", accent: "#FACC15" },
  { id: "hat-flower", name: "Corona de flores", slot: "hat", rarity: "rara", model: "flowers", color: "#F472B6", accent: "#FDE047" },
  { id: "hat-wizard", name: "Sombrero de mago", slot: "hat", rarity: "epica", model: "wizard", color: "#4C1D95", accent: "#FACC15" },
  { id: "hat-crown", name: "Corona real", slot: "hat", rarity: "legendaria", model: "crown", color: "#F59E0B", accent: "#DC2626" },
  // Gafas
  { id: "glasses-round", name: "Gafas redondas", slot: "glasses", rarity: "comun", model: "round", color: "#1E1B3A" },
  { id: "glasses-sun", name: "Gafas de sol", slot: "glasses", rarity: "rara", model: "sun", color: "#111827" },
  { id: "glasses-heart", name: "Gafas de corazón", slot: "glasses", rarity: "epica", model: "heart", color: "#EF4444" },
  { id: "glasses-star", name: "Gafas de estrella", slot: "glasses", rarity: "legendaria", model: "star", color: "#FACC15" },
  // Ropa
  { id: "outfit-tee-green", name: "Camiseta verde", slot: "outfit", rarity: "comun", model: "tee", color: "#16A34A" },
  { id: "outfit-tee-pink", name: "Camiseta rosa", slot: "outfit", rarity: "comun", model: "tee", color: "#EC4899" },
  { id: "outfit-hoodie", name: "Sudadera", slot: "outfit", rarity: "rara", model: "hoodie", color: "#7C3AED", accent: "#C4B5FD" },
  { id: "outfit-sport", name: "Equipación deportiva", slot: "outfit", rarity: "rara", model: "sport", color: "#0EA5E9", accent: "#FFFFFF" },
  { id: "outfit-suit", name: "Traje elegante", slot: "outfit", rarity: "epica", model: "suit", color: "#1F2937", accent: "#DC2626" },
  { id: "outfit-hero", name: "Traje de superhéroe", slot: "outfit", rarity: "legendaria", model: "hero", color: "#DC2626", accent: "#FACC15" },
  // Mascotas
  { id: "pet-chick", name: "Pollito", slot: "pet", rarity: "comun", model: "chick", color: "#FDE047", accent: "#F97316" },
  { id: "pet-cat", name: "Gatito", slot: "pet", rarity: "rara", model: "cat", color: "#F59E0B", accent: "#FFFFFF" },
  { id: "pet-dog", name: "Perrito", slot: "pet", rarity: "rara", model: "dog", color: "#A16207", accent: "#FEF3C7" },
  { id: "pet-bunny", name: "Conejito", slot: "pet", rarity: "epica", model: "bunny", color: "#F5F5F4", accent: "#F9A8D4" },
  { id: "pet-dragon", name: "Dragoncito", slot: "pet", rarity: "legendaria", model: "dragon", color: "#22C55E", accent: "#FDE047" },
  // Escenarios
  { id: "bg-park", name: "Parque", slot: "background", rarity: "comun", model: "park", color: "#BAE6FD", accent: "#86EFAC" },
  { id: "bg-beach", name: "Playa", slot: "background", rarity: "rara", model: "beach", color: "#7DD3FC", accent: "#FDE68A" },
  { id: "bg-sunset", name: "Atardecer", slot: "background", rarity: "epica", model: "sunset", color: "#FDBA74", accent: "#C084FC" },
  { id: "bg-space", name: "Espacio", slot: "background", rarity: "legendaria", model: "space", color: "#1E1B4B", accent: "#6D28D9" },
  // Poses
  { id: "pose-wave", name: "Saludo", slot: "pose", rarity: "comun", model: "wave", color: "#000000" },
  { id: "pose-peace", name: "Paz y amor", slot: "pose", rarity: "rara", model: "peace", color: "#000000" },
  { id: "pose-flex", name: "Músculo", slot: "pose", rarity: "epica", model: "flex", color: "#000000" },
  { id: "pose-champion", name: "Campeón", slot: "pose", rarity: "legendaria", model: "champion", color: "#000000" },
  // Efectos
  { id: "fx-sparkles", name: "Destellos", slot: "effect", rarity: "rara", model: "sparkles", color: "#FDE047" },
  { id: "fx-hearts", name: "Corazones", slot: "effect", rarity: "epica", model: "hearts", color: "#F43F5E" },
  { id: "fx-aura", name: "Aura dorada", slot: "effect", rarity: "legendaria", model: "aura", color: "#F59E0B" },
];

export const CATALOG: ShopItem[] = defs.map((d) => ({ ...d, price: d.price ?? RARITIES[d.rarity].base }));
export const ITEMS = new Map(CATALOG.map((i) => [i.id, i]));

/* ---------- Apariencia (gratis) ---------- */

export const SKIN_TONES = ["#FFE0C7", "#F6C9A5", "#E8B48A", "#C98E62", "#9C6644", "#6B4430"];
export const HAIR_COLORS = ["#1F1612", "#3B2A20", "#7A3E1D", "#B7672F", "#E6B655", "#D1D5DB", "#EC4899", "#6D4AFF"];
export const HAIR_STYLES = [
  { id: "short", label: "Corto" },
  { id: "spiky", label: "Pincho" },
  { id: "long", label: "Largo" },
  { id: "bun", label: "Moño" },
  { id: "curly", label: "Rizado" },
  { id: "pony", label: "Coleta" },
  { id: "bald", label: "Rapado" },
] as const;
export const EYE_STYLES = [
  { id: "dot", label: "Puntitos" },
  { id: "big", label: "Grandes" },
  { id: "lashes", label: "Pestañas" },
] as const;
export const BASE_OUTFIT_COLORS = ["#2563EB", "#F97316", "#16A34A", "#DB2777", "#7C3AED", "#0F172A", "#FACC15"];

export interface Appearance {
  skin: string;
  hair: string;
  hairStyle: (typeof HAIR_STYLES)[number]["id"];
  eyes: (typeof EYE_STYLES)[number]["id"];
  /** Color de la ropa básica cuando no llevas ropa de la tienda. */
  shirt: string;
}

export type Equipped = Partial<Record<Slot, string>>;

export function defaultAppearance(variant: "a" | "b"): Appearance {
  return variant === "a"
    ? { skin: SKIN_TONES[0], hair: HAIR_COLORS[1], hairStyle: "short", eyes: "dot", shirt: BASE_OUTFIT_COLORS[0] }
    : { skin: SKIN_TONES[1], hair: HAIR_COLORS[2], hairStyle: "long", eyes: "lashes", shirt: BASE_OUTFIT_COLORS[1] };
}

/** Limpia una apariencia que viene del cliente: cualquier valor desconocido vuelve al de por defecto. */
export function sanitizeAppearance(input: Partial<Appearance>, fallback: Appearance): Appearance {
  const pick = <T,>(v: unknown, allowed: readonly T[], def: T) => (allowed.includes(v as T) ? (v as T) : def);
  return {
    skin: pick(input.skin, SKIN_TONES, fallback.skin),
    hair: pick(input.hair, HAIR_COLORS, fallback.hair),
    hairStyle: pick(input.hairStyle, HAIR_STYLES.map((h) => h.id), fallback.hairStyle),
    eyes: pick(input.eyes, EYE_STYLES.map((e) => e.id), fallback.eyes),
    shirt: pick(input.shirt, BASE_OUTFIT_COLORS, fallback.shirt),
  };
}

/* ---------- Reglas de compra y equipamiento ---------- */

export type BuyCheck = { ok: true; price: number } | { ok: false; reason: string };

export function checkPurchase(itemId: string, owned: Iterable<string>, coins: number): BuyCheck {
  const item = ITEMS.get(itemId);
  if (!item) return { ok: false, reason: "Ese objeto no existe" };
  if (new Set(owned).has(itemId)) return { ok: false, reason: "Ya lo tienes" };
  if (coins < item.price) return { ok: false, reason: `Te faltan ${item.price - coins} monedas` };
  return { ok: true, price: item.price };
}

/** Equipa o quita (itemId null) en un hueco. Solo objetos que tengas y del hueco correcto. */
export function equip(current: Equipped, slot: Slot, itemId: string | null, owned: Iterable<string>): Equipped {
  const next = { ...current };
  if (itemId === null) {
    delete next[slot];
    return next;
  }
  const item = ITEMS.get(itemId);
  if (!item) throw new Error("Ese objeto no existe");
  if (item.slot !== slot) throw new Error("Ese objeto no va en ese hueco");
  if (!new Set(owned).has(itemId)) throw new Error("Primero tienes que comprarlo");
  next[slot] = itemId;
  return next;
}

/** Quita del equipamiento lo que ya no se tenga o no exista (p. ej. si se retira un objeto del catálogo). */
export function cleanEquipped(e: Equipped, owned: Iterable<string>): Equipped {
  const own = new Set(owned);
  const out: Equipped = {};
  for (const [slot, id] of Object.entries(e) as [Slot, string][]) {
    const item = ITEMS.get(id);
    if (item && item.slot === slot && own.has(id)) out[slot] = id;
  }
  return out;
}
