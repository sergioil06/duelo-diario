"use client";

import { useState } from "react";
import type { getLeaderboard } from "@/lib/leaderboard";
import type { Period } from "@/lib/domain/ranking";
import { Avatar2D } from "@/components/Avatar2D";
import { Icon } from "@/components/Icon";

type Data = Awaited<ReturnType<typeof getLeaderboard>>;

const PERIODS: { id: Period; label: string; empty: string }[] = [
  { id: "day", label: "Hoy", empty: "Nadie ha sumado puntos hoy." },
  { id: "week", label: "Semana", empty: "La semana acaba de empezar." },
  { id: "month", label: "Mes", empty: "Aún no hay puntos este mes." },
  { id: "all", label: "Histórico", empty: "Todavía no hay puntos." },
];

const shortDate = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", timeZone: "UTC" });
const fmt = (d: string) => shortDate.format(new Date(d + "T00:00:00Z"));

export function Standings({ data }: { data: Data }) {
  const [period, setPeriod] = useState<Period>("week");
  const rows = data.periods.find((p) => p.period === period)!.standings;
  const max = Math.max(1, ...rows.map((r) => r.points));
  const tie = rows.length === 2 && rows[0].points === rows[1].points;
  const lastWeek = data.weeks[0];
  const rival = data.ids.find((id) => id !== data.me);

  return (
    <div className="space-y-5">
      <section aria-labelledby="clasif" className="press rounded-[28px] bg-surface p-4">
        <h2 id="clasif" className="sr-only">
          Clasificación
        </h2>
        <div role="tablist" aria-label="Periodo" className="flex flex-wrap justify-center gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={period === p.id}
              onClick={() => setPeriod(p.id)}
              className={`min-h-10 rounded-full px-4 text-[13px] font-extrabold ${period === p.id ? "bg-primary text-primary-ink" : "bg-surface-2 text-muted"}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <ol className="mt-4 space-y-3">
          {rows.map((r, i) => {
            const isMe = r.userId === data.me;
            const leader = i === 0 && !tie && r.points > 0;
            return (
              <li key={r.userId} className="flex items-center gap-3">
                <span className="w-6 text-center font-display text-xl font-extrabold text-muted" aria-label={`Puesto ${tie ? 1 : i + 1}`}>
                  {tie ? 1 : i + 1}
                </span>
                <div className="relative shrink-0">
                  <Avatar2D side={isMe ? "me" : "rival"} look={data.looks[r.userId]} label="" size={52} mood={leader ? "happy" : "idle"} />
                  {leader && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-gold" aria-label="Va primero">
                      <Icon name="crown" size={22} stroke={2.4} />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-extrabold">
                      {data.names[r.userId]}
                      {isMe && <span className="ml-1 text-sm text-muted">(tú)</span>}
                    </span>
                    <span className="font-display text-2xl font-extrabold tabular-nums">{r.points}</span>
                  </div>
                  <div className="mt-1 h-3 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className={`h-full rounded-full transition-[width] duration-700 ${isMe ? "bg-chart-me" : "bg-chart-rival"}`}
                      style={{ width: `${(r.points / max) * 100}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs font-bold text-muted">{r.missions === 1 ? "1 misión" : `${r.missions} misiones`}</p>
                </div>
              </li>
            );
          })}
        </ol>
        {rows.every((r) => r.points === 0) && (
          <p className="mt-3 text-center text-sm font-bold text-muted">{PERIODS.find((p) => p.id === period)!.empty}</p>
        )}
      </section>

      <section aria-labelledby="ultima" className="press rounded-[28px] bg-primary p-4 text-primary-ink [--press-shadow:var(--primary-press)]">
        <h2 id="ultima" className="flex items-center gap-2 font-display text-lg font-extrabold">
          <Icon name="trophy" size={22} /> Ganador de la semana
        </h2>
        {lastWeek ? (
          <div className="mt-2">
            <p className="text-sm font-bold opacity-90">
              Semana del {fmt(lastWeek.weekStart)} al {fmt(lastWeek.weekEnd)}
            </p>
            <p className="mt-1 font-display text-2xl font-extrabold">
              {lastWeek.winner ? `${data.names[lastWeek.winner]} gana` : "Empate"}{" "}
              <span className="tabular-nums">
                {lastWeek.scores[0]?.points ?? 0} a {lastWeek.scores[1]?.points ?? 0}
              </span>
            </p>
            {lastWeek.bet && lastWeek.winner && (
              <p className="mt-2 rounded-2xl bg-white/15 px-3 py-2 text-sm font-bold">
                Apuesta: {lastWeek.bet}.{" "}
                Le toca a {data.names[lastWeek.scores.find((s) => s.userId !== lastWeek.winner)!.userId]}.
              </p>
            )}
          </div>
        ) : (
          <p className="mt-2 text-sm font-bold opacity-90">La primera semana se cierra el domingo a medianoche. ¡A sumar!</p>
        )}
        <div className="mt-3 flex gap-2">
          {data.ids.map((id) => (
            <span key={id} className="flex-1 rounded-2xl bg-white/15 px-3 py-2 text-center">
              <span className="block font-display text-2xl font-extrabold tabular-nums">{data.wins[id] ?? 0}</span>
              <span className="block text-xs font-bold opacity-90">semanas de {data.names[id]}</span>
            </span>
          ))}
        </div>
      </section>

      {data.weeks.length > 1 && (
        <section aria-labelledby="historial" className="press rounded-[28px] bg-surface p-4">
          <h2 id="historial" className="font-display text-lg font-extrabold">
            Semanas anteriores
          </h2>
          <ul className="mt-2 divide-y-2 divide-surface-2">
            {data.weeks.slice(1).map((w) => {
              const mine = w.scores.find((s) => s.userId === data.me)?.points ?? 0;
              const theirs = w.scores.find((s) => s.userId === rival)?.points ?? 0;
              return (
                <li key={w.weekStart} className="flex items-center gap-3 py-2.5">
                  <span className="flex-1 text-sm font-bold">
                    {fmt(w.weekStart)} – {fmt(w.weekEnd)}
                    {w.bet && <span className="block text-xs text-muted">{w.bet}</span>}
                  </span>
                  <span className="tabular-nums font-extrabold">
                    <span className="text-me">{mine}</span> <span className="text-muted">:</span> <span className="text-rival">{theirs}</span>
                  </span>
                  <span
                    className={`w-24 rounded-full px-2 py-1 text-center text-xs font-extrabold ${
                      !w.winner ? "bg-surface-2 text-muted" : w.winner === data.me ? "bg-ok-soft text-ok-ink" : "bg-warn-soft text-warn-ink"
                    }`}
                  >
                    {!w.winner ? "Empate" : w.winner === data.me ? "Ganaste" : `Ganó ${data.names[w.winner]}`}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
