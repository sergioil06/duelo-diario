import { RARITIES, type ShopItem } from "@/lib/domain/shop";
import { Icon } from "@/components/Icon";

const SLOT_ICON: Record<ShopItem["slot"], string> = {
  hat: "crown",
  glasses: "sun",
  outfit: "user",
  pet: "heart",
  background: "plant",
  pose: "run",
  effect: "sparkle",
};

/** Ficha visual de un objeto: color del objeto, icono del hueco y anillo de rareza. */
export function ItemTile({ item, size = 64 }: { item: ShopItem; size?: number }) {
  const r = RARITIES[item.rarity];
  return (
    <span
      className="relative flex items-center justify-center rounded-2xl"
      style={{ width: size, height: size, background: `color-mix(in oklab, ${r.color} 14%, var(--surface))`, boxShadow: `inset 0 0 0 3px ${r.color}` }}
    >
      <span className="flex size-[60%] items-center justify-center rounded-full text-white" style={{ background: item.slot === "pose" ? r.color : item.color }}>
        <Icon name={SLOT_ICON[item.slot]} size={Math.round(size * 0.34)} stroke={2.4} />
      </span>
      {item.rarity === "legendaria" && (
        <span className="absolute -right-1 -top-1 text-gold" aria-hidden="true">
          <Icon name="sparkle" size={18} stroke={2.4} />
        </span>
      )}
    </span>
  );
}

export function RarityPill({ rarity }: { rarity: ShopItem["rarity"] }) {
  const r = RARITIES[rarity];
  return (
    <span className="rounded-full px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-white" style={{ background: r.color }}>
      {r.label}
    </span>
  );
}
