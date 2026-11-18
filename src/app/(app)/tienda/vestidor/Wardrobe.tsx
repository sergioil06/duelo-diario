"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { appearanceAction, equipAction } from "@/app/actions";
import {
  BASE_OUTFIT_COLORS, EYE_STYLES, HAIR_COLORS, HAIR_STYLES, ITEMS, SKIN_TONES, SLOTS,
  type Appearance, type Equipped, type Slot,
} from "@/lib/domain/shop";
import type { getShop } from "@/lib/shop-server";
import { Avatar } from "@/components/avatar/Avatar";
import { ItemTile } from "@/components/avatar/ItemBadge";
import { Icon } from "@/components/Icon";

type Data = Awaited<ReturnType<typeof getShop>>;

function Swatches({ label, values, value, onPick }: { label: string; values: string[]; value: string; onPick: (v: string) => void }) {
  return (
    <fieldset>
      <legend className="text-sm font-extrabold">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((c, i) => (
          <button
            key={c}
            type="button"
            aria-label={`${label} ${i + 1}`}
            aria-pressed={value === c}
            onClick={() => onPick(c)}
            className={`size-11 rounded-full border-[3px] ${value === c ? "border-primary" : "border-surface-2"}`}
            style={{ background: c, boxShadow: value === c ? "inset 0 0 0 3px var(--surface)" : undefined }}
          />
        ))}
      </div>
    </fieldset>
  );
}

function Chips<T extends string>({ label, options, value, onPick }: { label: string; options: readonly { id: T; label: string }[]; value: T; onPick: (v: T) => void }) {
  return (
    <fieldset>
      <legend className="text-sm font-extrabold">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={value === o.id}
            onClick={() => onPick(o.id)}
            className={`min-h-10 rounded-full px-4 text-sm font-extrabold ${value === o.id ? "bg-primary text-primary-ink" : "bg-surface-2 text-muted"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function Wardrobe({ data, name }: { data: Data; name: string }) {
  const [look, setLook] = useState<Appearance>(data.avatar.appearance);
  const [equipped, setEquipped] = useState<Equipped>(data.avatar.equipped);
  const [tab, setTab] = useState<"look" | "items">("look");
  const [status, setStatus] = useState<string | null>(null);
  const [, start] = useTransition();

  const change = (patch: Partial<Appearance>) => {
    const next = { ...look, ...patch };
    setLook(next);
    setStatus("Guardando…");
    start(async () => {
      const r = await appearanceAction(next as unknown as Record<string, string>);
      setStatus(r.ok ? "Guardado" : r.error);
    });
  };

  const toggle = (slot: Slot, id: string) => {
    const on = equipped[slot] === id;
    const next = { ...equipped };
    if (on) delete next[slot];
    else next[slot] = id;
    setEquipped(next);
    start(async () => {
      const r = await equipAction(slot, on ? null : id);
      if (!r.ok) {
        setEquipped(equipped);
        setStatus(r.error);
      }
    });
  };

  return (
    <div className="md:grid md:grid-cols-[minmax(0,380px)_1fr] md:items-start md:gap-6">
      <section aria-label="Tu avatar" className="press sticky top-0 z-20 -mx-4 rounded-b-[28px] bg-surface px-4 pb-3 pt-2 md:static md:mx-0 md:rounded-[28px] md:pt-4">
        <Avatar
          className="mx-auto h-[230px] w-full overflow-hidden rounded-3xl md:h-[380px]"
          interactive
          appearance={look}
          equipped={equipped}
          label={`Avatar 3D de ${name}. Arrastra para girarlo.`}
        />
        <p className="mt-1 text-center text-xs font-bold text-muted" role="status">
          {status ?? "Arrastra para girar. Los cambios se guardan solos."}
        </p>
      </section>

      <div className="mt-4 md:mt-0">
        <div role="tablist" aria-label="Vestidor" className="grid grid-cols-2 gap-1.5 rounded-2xl bg-surface p-1.5">
          {(
            [
              ["look", "Aspecto"],
              ["items", "Inventario"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`min-h-11 rounded-xl text-sm font-extrabold ${tab === id ? "bg-primary text-primary-ink" : "text-muted"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "look" ? (
          <div className="press mt-3 space-y-5 rounded-[28px] bg-surface p-4">
            <Swatches label="Piel" values={SKIN_TONES} value={look.skin} onPick={(skin) => change({ skin })} />
            <Chips label="Peinado" options={HAIR_STYLES} value={look.hairStyle} onPick={(hairStyle) => change({ hairStyle })} />
            <Swatches label="Color de pelo" values={HAIR_COLORS} value={look.hair} onPick={(hair) => change({ hair })} />
            <Chips label="Ojos" options={EYE_STYLES} value={look.eyes} onPick={(eyes) => change({ eyes })} />
            <Swatches label="Camiseta básica" values={BASE_OUTFIT_COLORS} value={look.shirt} onPick={(shirt) => change({ shirt })} />
          </div>
        ) : data.owned.length === 0 ? (
          <div className="press mt-3 rounded-[28px] bg-surface p-6 text-center">
            <p className="font-extrabold">Aún no tienes accesorios.</p>
            <Link href="/tienda" className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-2xl bg-primary px-5 font-extrabold text-primary-ink">
              <Icon name="bag" size={20} /> Ir a la tienda
            </Link>
          </div>
        ) : (
          <div className="mt-3 space-y-4">
            {SLOTS.map((s) => {
              const mine = data.owned.map((id) => ITEMS.get(id)).filter((i) => i && i.slot === s.id);
              if (mine.length === 0) return null;
              return (
                <section key={s.id} className="press rounded-[28px] bg-surface p-4">
                  <h2 className="font-display text-lg font-extrabold">{s.label}</h2>
                  <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {mine.map((i) => {
                      const on = equipped[s.id] === i!.id;
                      return (
                        <li key={i!.id}>
                          <button
                            onClick={() => toggle(s.id, i!.id)}
                            aria-pressed={on}
                            className={`flex w-full flex-col items-center gap-1 rounded-2xl border-[3px] p-2 ${on ? "border-ok bg-ok-soft" : "border-transparent bg-surface-2"}`}
                          >
                            <ItemTile item={i!} size={52} />
                            <span className="text-xs font-extrabold leading-tight">{i!.name}</span>
                            <span className={`text-[11px] font-extrabold ${on ? "text-ok-ink" : "text-muted"}`}>{on ? "Puesto" : "Ponérmelo"}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
