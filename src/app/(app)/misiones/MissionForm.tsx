"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveMissionAction } from "@/app/actions";
import type { Mission } from "@/lib/db/schema";
import { CATEGORY_COLORS, ICON_KEYS } from "@/lib/icons";
import { Icon } from "@/components/Icon";
import { WEEKDAYS } from "./describe";

const CATEGORIES = ["deporte", "salud", "hogar", "mente", "reto"];
const field = "mt-1 w-full rounded-2xl border-2 border-line bg-bg px-4 py-3 font-bold";
const label = "block text-sm font-extrabold";

export function MissionForm({
  mission,
  people,
}: {
  mission?: Mission;
  people: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(saveMissionAction.bind(null, mission?.id ?? null), {});
  const f = mission?.frequency ?? { type: "daily" as const };
  const [freq, setFreq] = useState<"daily" | "weekdays" | "weekly">(f.type);
  const [kind, setKind] = useState(mission?.kind ?? "check");
  const [icon, setIcon] = useState(mission?.icon ?? "star");
  const [category, setCategory] = useState(mission?.category ?? "salud");

  return (
    <form action={action} className="press space-y-5 rounded-[28px] bg-surface p-5">
      <div>
        <label htmlFor="title" className={label}>
          Nombre
        </label>
        <input id="title" name="title" required maxLength={60} defaultValue={mission?.title} placeholder="Ej.: Ir al gimnasio" className={field} />
      </div>

      <fieldset>
        <legend className={label}>Icono</legend>
        <input type="hidden" name="icon" value={icon} />
        <div className="mt-2 grid grid-cols-8 gap-2">
          {ICON_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              aria-label={k}
              aria-pressed={icon === k}
              onClick={() => setIcon(k)}
              className={`flex aspect-square items-center justify-center rounded-xl ${icon === k ? "bg-primary text-primary-ink" : "bg-surface-2 text-ink"}`}
            >
              <Icon name={k} size={22} />
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={label}>Categoría</legend>
        <input type="hidden" name="category" value={category} />
        <div className="mt-2 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
              className={`min-h-10 rounded-full px-4 text-sm font-extrabold capitalize ${category === c ? "text-white" : "bg-surface-2 text-muted"}`}
              style={category === c ? { background: CATEGORY_COLORS[c] } : undefined}
            >
              {c}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="points" className={label}>
            Puntos
          </label>
          <input id="points" name="points" type="number" min={1} max={1000} required defaultValue={mission?.points ?? 10} className={field} />
        </div>
        <div>
          <label htmlFor="assignee" className={label}>
            Para
          </label>
          <select id="assignee" name="assignee" defaultValue={mission?.assignee ?? "both"} className={field}>
            <option value="both">Los dos</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                Solo {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset>
        <legend className={label}>Frecuencia</legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(
            [
              ["daily", "Cada día"],
              ["weekdays", "Días concretos"],
              ["weekly", "X por semana"],
            ] as const
          ).map(([v, l]) => (
            <label key={v} className={`flex min-h-11 cursor-pointer items-center justify-center rounded-2xl text-center text-sm font-extrabold ${freq === v ? "bg-primary text-primary-ink" : "bg-surface-2 text-muted"}`}>
              <input type="radio" name="freqType" value={v} checked={freq === v} onChange={() => setFreq(v)} className="sr-only" />
              {l}
            </label>
          ))}
        </div>
        {freq === "weekdays" && (
          <div className="mt-3 flex justify-between gap-1">
            {WEEKDAYS.map((d, i) => (
              <label key={d} className="flex-1">
                <input
                  type="checkbox"
                  name="days"
                  value={i + 1}
                  defaultChecked={f.type === "weekdays" && f.days.includes(i + 1)}
                  className="peer sr-only"
                />
                <span className="flex aspect-square items-center justify-center rounded-full bg-surface-2 font-extrabold text-muted peer-checked:bg-primary peer-checked:text-primary-ink peer-focus-visible:outline-3 peer-focus-visible:outline-primary">
                  {d}
                </span>
              </label>
            ))}
          </div>
        )}
        {freq === "weekly" && (
          <div className="mt-3">
            <label htmlFor="times" className="text-sm font-bold text-muted">
              Veces por semana
            </label>
            <input id="times" name="times" type="number" min={1} max={7} defaultValue={f.type === "weekly" ? f.times : 3} className={field} />
          </div>
        )}
      </fieldset>

      <fieldset>
        <legend className={label}>Tipo</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(
            [
              ["check", "Marcar como hecha"],
              ["steps", "Objetivo de pasos"],
            ] as const
          ).map(([v, l]) => (
            <label key={v} className={`flex min-h-11 cursor-pointer items-center justify-center rounded-2xl text-sm font-extrabold ${kind === v ? "bg-primary text-primary-ink" : "bg-surface-2 text-muted"}`}>
              <input type="radio" name="kind" value={v} checked={kind === v} onChange={() => setKind(v)} className="sr-only" />
              {l}
            </label>
          ))}
        </div>
        {kind === "steps" && (
          <div className="mt-3">
            <label htmlFor="target" className="text-sm font-bold text-muted">
              Pasos objetivo
            </label>
            <input id="target" name="target" type="number" min={100} max={100000} step={500} defaultValue={mission?.target ?? 10000} className={field} />
          </div>
        )}
      </fieldset>

      <div className="space-y-3">
        <label className="flex min-h-11 items-center justify-between gap-3 rounded-2xl bg-surface-2 px-4 py-2">
          <span>
            <span className="block font-extrabold">Tu pareja la valida</span>
            <span className="block text-[13px] font-bold text-muted">Los puntos no cuentan hasta que la apruebe.</span>
          </span>
          <input type="checkbox" name="requiresValidation" defaultChecked={mission?.requiresValidation} className="size-6 accent-[var(--primary)]" />
        </label>
        <label className="flex min-h-11 items-center justify-between gap-3 rounded-2xl bg-surface-2 px-4 py-2">
          <span>
            <span className="block font-extrabold">Reto semanal</span>
            <span className="block text-[13px] font-bold text-muted">Paga todos los puntos al completar las veces de la semana.</span>
          </span>
          <input type="checkbox" name="isChallenge" defaultChecked={mission?.isChallenge} className="size-6 accent-[var(--primary)]" />
        </label>
      </div>

      {state?.error && (
        <p role="alert" className="text-sm font-bold text-danger">
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Link href="/misiones" className="flex min-h-12 items-center rounded-2xl px-4 font-extrabold text-muted">
          Cancelar
        </Link>
        <button
          disabled={pending}
          className="press min-h-12 rounded-2xl bg-primary px-6 font-display text-lg font-extrabold text-primary-ink [--press-shadow:var(--primary-press)] disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}
