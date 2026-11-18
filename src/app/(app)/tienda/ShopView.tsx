"use client";

import { useMemo, useState, useTransition } from "react";
import { buyAction, equipAction } from "@/app/actions";
import { CATALOG, ITEMS, SLOTS, type Rarity, type Slot } from "@/lib/domain/shop";
import type { getShop } from "@/lib/shop-server";
import { Avatar } from "@/components/avatar/Avatar";
import { ItemTile, RarityPill } from "@/components/avatar/ItemBadge";
import { CoinIcon } from "@/components/Icon";
import { celebrate } from "@/components/celebrate";

type Data = Awaited<ReturnType<typeof getShop>>;
const RARITY_ORDER: Rarity[] = ["comun", "rara", "epica", "legendaria"];

export function ShopView({ data, name }: { data: Data; name: string }) {
  const [slot, setSlot] = useState<Slot | "all">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [cheer, setCheer] = useState(0);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [pending, start] = useTransition();
  const owned = useMemo(() => new Set(data.owned), [data.owned]);
  const item = selected ? ITEMS.get(selected) : undefined;

  // Probador: el objeto seleccionado se ve puesto aunque aún no sea tuyo.
  const preview = item ? { ...data.avatar.equipped, [item.slot]: item.id } : data.avatar.equipped;
  const items = CATALOG.filter((i) => slot === "all" || i.slot === slot).sort(
    (a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity) || a.price - b.price,
  );

  const buy = (btn: HTMLElement) =>
    item &&
    start(async () => {
      const r = await buyAction(item.id);
      if (!r.ok) return setMsg({ text: r.error, error: true });
      celebrate(btn);
      setCheer((c) => c + 1);
      setMsg({ text: `¡${item.name} es tuyo!` });
    });

  const wear = () =>
    item &&
    start(async () => {
      const on = data.avatar.equipped[item.slot] === item.id;
      const r = await equipAction(item.slot, on ? null : item.id);
      setMsg(r.ok ? { text: on ? "Quitado" : "Equipado" } : { text: r.error, error: true });
    });

  return (
    <div className="md:grid md:grid-cols-[minmax(0,380px)_1fr] md:items-start md:gap-6">
      <section aria-label="Probador" className="press sticky top-0 z-20 -mx-4 rounded-b-[28px] bg-surface px-4 pb-3 pt-2 md:static md:top-8 md:mx-0 md:rounded-[28px] md:pt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-extrabold text-muted">Probador</p>
          <span className="flex items-center gap-1 rounded-full bg-surface-2 px-3 py-1 text-sm font-extrabold" aria-label={`${data.coins} monedas`}>
            <CoinIcon /> {data.coins}
          </span>
        </div>
        <Avatar
          className="mx-auto mt-1 h-[210px] w-full overflow-hidden rounded-3xl md:h-[360px]"
          interactive
          appearance={data.avatar.appearance}
          equipped={preview}
          celebrate={cheer}
          label={`Avatar 3D de ${name}${item ? ` probando ${item.name}` : ""}. Arrastra para girarlo.`}
        />
        {item ? (
          <div className="mt-2 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-extrabold">{item.name}</p>
              <RarityPill rarity={item.rarity} />
            </div>
            {owned.has(item.id) ? (
              <button onClick={wear} disabled={pending} className="press min-h-12 rounded-2xl bg-ok px-5 font-extrabold text-white [--press-shadow:#166534]">
                {data.avatar.equipped[item.slot] === item.id ? "Quitar" : "Equipar"}
              </button>
            ) : (
              <button
                onClick={(e) => buy(e.currentTarget)}
                disabled={pending || data.coins < item.price}
                className="press flex min-h-12 items-center gap-1.5 rounded-2xl bg-primary px-5 font-extrabold text-primary-ink [--press-shadow:var(--primary-press)] disabled:opacity-50"
              >
                Comprar <CoinIcon size={16} /> {item.price}
              </button>
            )}
          </div>
        ) : (
          <p className="mt-2 text-center text-sm font-bold text-muted">Toca un objeto para probártelo.</p>
        )}
        {msg && (
          <p role={msg.error ? "alert" : "status"} className={`mt-1 text-center text-sm font-bold ${msg.error ? "text-danger" : "text-ok"}`}>
            {msg.text}
          </p>
        )}
      </section>

      <div>
        <div role="tablist" aria-label="Tipo de objeto" className="mt-4 -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 md:mx-0 md:mt-0 md:flex-wrap md:px-0">
          {[{ id: "all" as const, label: "Todo" }, ...SLOTS].map((s) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={slot === s.id}
              onClick={() => setSlot(s.id)}
              className={`min-h-10 shrink-0 rounded-full px-4 text-[13px] font-extrabold ${slot === s.id ? "bg-primary text-primary-ink" : "bg-surface text-muted"}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {items.map((i) => {
            const have = owned.has(i.id);
            const on = data.avatar.equipped[i.slot] === i.id;
            return (
              <li key={i.id}>
                <button
                  onClick={() => {
                    setSelected(selected === i.id ? null : i.id);
                    setMsg(null);
                  }}
                  aria-pressed={selected === i.id}
                  className={`press flex h-full w-full flex-col items-center gap-1.5 rounded-3xl border-[3px] bg-surface p-3 text-center ${selected === i.id ? "border-primary" : "border-transparent"}`}
                >
                  <ItemTile item={i} />
                  <span className="text-[15px] font-extrabold leading-tight">{i.name}</span>
                  <RarityPill rarity={i.rarity} />
                  {have ? (
                    <span className="rounded-full bg-ok-soft px-2.5 py-0.5 text-xs font-extrabold text-ok-ink">{on ? "Puesto" : "Tuyo"}</span>
                  ) : (
                    <span className={`flex items-center gap-1 text-sm font-extrabold ${data.coins < i.price ? "text-muted" : ""}`}>
                      <CoinIcon size={16} /> {i.price}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
