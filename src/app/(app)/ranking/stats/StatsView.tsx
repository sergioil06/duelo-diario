"use client";

import { useState } from "react";
import type { getStats } from "@/lib/leaderboard";
import type { Bucket } from "@/lib/domain/stats";
import { GroupedBars, type Series } from "@/components/charts/GroupedBars";

type Data = Awaited<ReturnType<typeof getStats>>;

const BUCKETS: { id: Bucket; label: string; title: string }[] = [
  { id: "day", label: "Días", title: "Puntos por día (14 días)" },
  { id: "week", label: "Semanas", title: "Puntos por semana (8 semanas)" },
  { id: "month", label: "Meses", title: "Puntos por mes (6 meses)" },
];

const dayFmt = new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

export function StatsView({ data, meId }: { data: Data; meId: string }) {
  const [bucket, setBucket] = useState<Bucket>("day");
  const series: Series[] = data.ids.map((id) => ({
    id,
    name: data.names[id],
    color: id === meId ? "var(--chart-me)" : "var(--chart-rival)",
  }));
  const catMax = Math.max(1, ...data.byCategory.flatMap((c) => Object.values(c.values)));
  const totals = data.ids.map((id) => ({ id, total: data.series[bucket].reduce((s, r) => s + (r.values[id] ?? 0), 0) }));

  return (
    <div className="space-y-5">
      <section className="press rounded-[28px] bg-surface p-4">
        <div role="tablist" aria-label="Agrupar por" className="mb-3 flex gap-1.5">
          {BUCKETS.map((b) => (
            <button
              key={b.id}
              role="tab"
              aria-selected={bucket === b.id}
              onClick={() => setBucket(b.id)}
              className={`min-h-10 rounded-full px-4 text-[13px] font-extrabold ${bucket === b.id ? "bg-primary text-primary-ink" : "bg-surface-2 text-muted"}`}
            >
              {b.label}
            </button>
          ))}
        </div>
        <div className="mb-3 grid grid-cols-2 gap-2">
          {totals.map((t) => (
            <div key={t.id} className="rounded-2xl bg-surface-2 px-3 py-2">
              <p className="text-xs font-bold text-muted">{data.names[t.id]} en el periodo</p>
              <p className={`font-display text-2xl font-extrabold tabular-nums ${t.id === meId ? "text-me" : "text-rival"}`}>{t.total}</p>
            </div>
          ))}
        </div>
        <GroupedBars rows={data.series[bucket]} series={series} title={BUCKETS.find((b) => b.id === bucket)!.title} />
      </section>

      <section className="press rounded-[28px] bg-surface p-4" aria-labelledby="cat-title">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="cat-title" className="font-display text-lg font-extrabold">
            Puntos por categoría
          </h2>
          <ul className="flex gap-3 text-[13px] font-bold text-muted" aria-label="Leyenda">
            {series.map((s) => (
              <li key={s.id} className="flex items-center gap-1.5">
                <span className="inline-block size-3 rounded-[3px]" style={{ background: s.color }} aria-hidden="true" />
                {s.name}
              </li>
            ))}
          </ul>
        </div>
        {data.byCategory.length === 0 ? (
          <p className="mt-3 text-sm font-bold text-muted">Aún no hay misiones aprobadas.</p>
        ) : (
          <dl className="mt-3 space-y-3">
            {data.byCategory.map((c) => (
              <div key={c.category}>
                <dt className="text-sm font-extrabold capitalize">{c.category}</dt>
                {series.map((s) => (
                  <dd key={s.id} className="mt-1 flex items-center gap-2" title={`${s.name}: ${c.values[s.id] ?? 0}`}>
                    <span className="sr-only">{s.name}:</span>
                    <span className="h-3 flex-1 overflow-hidden rounded-full bg-surface-2">
                      <span
                        className="block h-full rounded-r-[4px]"
                        style={{ width: `${((c.values[s.id] ?? 0) / catMax) * 100}%`, background: s.color }}
                      />
                    </span>
                    <span className="w-12 text-right text-sm font-extrabold tabular-nums">{c.values[s.id] ?? 0}</span>
                  </dd>
                ))}
              </div>
            ))}
          </dl>
        )}
      </section>

      <section className="press rounded-[28px] bg-surface p-4" aria-labelledby="hist-title">
        <h2 id="hist-title" className="font-display text-lg font-extrabold">
          Historial reciente
        </h2>
        {data.recent.length === 0 ? (
          <p className="mt-2 text-sm font-bold text-muted">Todavía no hay nada.</p>
        ) : (
          <ul className="mt-2 divide-y-2 divide-surface-2">
            {data.recent.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-2">
                <span
                  className="inline-block size-2.5 shrink-0 rounded-full"
                  style={{ background: r.userId === meId ? "var(--chart-me)" : "var(--chart-rival)" }}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 text-sm">
                  <span className="font-extrabold">{data.names[r.userId]}</span> · {r.title}
                  <span className="block text-xs font-bold capitalize text-muted">{dayFmt.format(new Date(r.date + "T00:00:00Z"))}</span>
                </span>
                {r.status === "pending" ? (
                  <span className="rounded-full bg-warn-soft px-2 py-0.5 text-xs font-extrabold text-warn-ink">Por validar</span>
                ) : (
                  <span className="font-extrabold tabular-nums">+{r.points}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
