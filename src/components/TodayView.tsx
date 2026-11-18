"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeAction, stepsAction, undoAction, validateAction } from "@/app/actions";
import type { Dashboard } from "@/lib/game";
import { CATEGORY_COLORS, FALLBACK_TILE } from "@/lib/icons";
import { Avatar2D, type Mood } from "./Avatar2D";
import { CoinIcon, FlameIcon, Icon } from "./Icon";
import { celebrate } from "./celebrate";

type Range = "today" | "week" | "total";
const RANGE_LABEL: Record<Range, string> = { today: "Hoy", week: "Semana", total: "Total" };

const dateFmt = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "short", timeZone: "Europe/Madrid" });

function useLiveRefresh(ms = 5000) {
  const router = useRouter();
  useEffect(() => {
    // Sincronización casi en directo: refresca al volver a la app y cada pocos segundos.
    const tick = () => document.visibilityState === "visible" && router.refresh();
    const id = setInterval(tick, ms);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [router, ms]);
}

export function TodayView({ data }: { data: Dashboard }) {
  useLiveRefresh();
  const [range, setRange] = useState<Range>("today");
  const [mood, setMood] = useState<Mood>("idle");
  const [toast, setToast] = useState<{ text: string; key: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const stepsDialog = useRef<HTMLDialogElement>(null);
  const { me, partner } = data;

  useEffect(() => {
    if (mood !== "idle") return;
    const hour = Number(new Intl.DateTimeFormat("es-ES", { hour: "numeric", timeZone: "Europe/Madrid" }).format(new Date()));
    if (me.dueToday > 0 && me.doneToday === 0 && hour >= 20) setMood("sad");
  }, [me.dueToday, me.doneToday, mood]);

  const run = (id: string, fn: () => Promise<{ ok: boolean; error?: string; data?: unknown }>, onOk?: (d: unknown) => void) => {
    setBusy(id);
    setError(null);
    startTransition(async () => {
      const r = await fn();
      setBusy(null);
      if (!r.ok) setError(r.error ?? "Algo ha fallado");
      else onOk?.(r.data);
    });
  };

  const complete = (missionId: string, origin: HTMLElement) =>
    run(missionId, () => completeAction(missionId), (d) => {
      const { points, multiplier, pending } = d as { points: number; multiplier: number; pending: boolean };
      celebrate(origin);
      setMood("happy");
      setTimeout(() => setMood("idle"), 1900);
      const bonus = multiplier > 1 ? ` (x${multiplier} por racha)` : "";
      setToast({
        text: pending ? `+${points} cuando ${partner?.name ?? "tu pareja"} lo valide` : points > 0 ? `+${points} puntos${bonus}` : "¡Un paso más del reto!",
        key: Date.now(),
      });
    });

  const score = (p: NonNullable<typeof partner>) => (range === "today" ? p.today : range === "week" ? p.week : p.total);
  const myScore = score(me);
  const theirScore = partner ? score(partner) : 0;
  const diff = myScore - theirScore;
  const stepsMission = data.missionsToday.find((s) => s.mission.kind === "steps");

  return (
    <div className="mx-auto max-w-lg md:max-w-none">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-bold capitalize text-muted">{dateFmt.format(new Date())}</p>
          <h1 className="font-display text-2xl font-extrabold leading-tight">Hola, {me.name}</h1>
        </div>
        <div className="flex gap-2">
          <span className="press flex items-center gap-1 rounded-full bg-surface px-3 py-1.5 text-sm font-extrabold" title={`Racha de ${me.streak} días · x${me.multiplier}`}>
            <FlameIcon /> {me.streak}
            <span className="sr-only">días de racha</span>
          </span>
          <span className="press flex items-center gap-1 rounded-full bg-surface px-3 py-1.5 text-sm font-extrabold" title="Monedas para la tienda">
            <CoinIcon /> {me.coins}
            <span className="sr-only">monedas</span>
          </span>
        </div>
      </header>

      <div className="mt-3 md:grid md:grid-cols-[minmax(0,420px)_1fr] md:items-start md:gap-6">
        <section aria-label="Marcador" className="press relative rounded-[28px] bg-surface p-3.5 md:sticky md:top-8">
          <div role="tablist" aria-label="Periodo" className="flex justify-center gap-1.5">
            {(Object.keys(RANGE_LABEL) as Range[]).map((r) => (
              <button
                key={r}
                role="tab"
                aria-selected={range === r}
                onClick={() => setRange(r)}
                className={`min-h-9 rounded-full px-4 text-[13px] font-extrabold ${range === r ? "bg-primary text-primary-ink" : "bg-surface-2 text-muted"}`}
              >
                {RANGE_LABEL[r]}
              </button>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-[1fr_auto_1fr] items-end">
            <div className="flex flex-col items-center">
              <Avatar2D side="me" look={me.look} mood={mood} label={`Avatar de ${me.name}`} />
              <span className="text-sm font-extrabold">{me.name}</span>
            </div>
            <div className="flex flex-col items-center pb-3" aria-live="polite">
              <span className="font-display text-[13px] font-extrabold tracking-widest text-primary">VS</span>
              <div className="flex items-baseline gap-1.5 font-display font-extrabold tabular-nums">
                <span className="text-[40px] leading-none text-me">{myScore}</span>
                <span className="text-xl text-muted">:</span>
                <span className="text-[40px] leading-none text-rival">{theirScore}</span>
              </div>
              <span className="mt-1 text-xs font-bold text-muted">
                {!partner ? "Sin rival aún" : diff > 0 ? `Vas ganando por ${diff}` : diff < 0 ? `Te saca ${-diff}` : "Empate"}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <Avatar2D side="rival" look={partner?.look} label={`Avatar de ${partner?.name ?? "tu pareja"}`} />
              <span className="text-sm font-extrabold">{partner?.name ?? "—"}</span>
            </div>
          </div>
          {data.bet && (
            <p className="mt-1.5 flex items-center justify-center gap-1.5 rounded-2xl bg-warn-soft px-3 py-2 text-center text-[12.5px] font-bold text-warn-ink">
              <Icon name="fork" size={16} /> Apuesta: {data.bet}
            </p>
          )}
          {toast && (
            <span key={toast.key} className="float-up pointer-events-none absolute left-1/2 bottom-16 whitespace-nowrap rounded-full bg-ink px-3 py-1 text-sm font-extrabold text-bg">
              {toast.text}
            </span>
          )}
        </section>

        <div>
          {data.toValidate.length > 0 && (
            <section aria-label="Por validar" className="mt-5 rounded-3xl bg-warn-soft p-3.5 text-warn-ink md:mt-0 md:mb-5">
              <h2 className="flex items-center gap-2 font-display text-lg font-extrabold">
                <Icon name="shield" size={20} /> {partner?.name} pide que valides
              </h2>
              <ul className="mt-2 space-y-2">
                {data.toValidate.map((c) => (
                  <li key={c.id} className="flex items-center gap-2 rounded-2xl bg-surface p-2.5 text-ink">
                    <span className="flex-1 text-sm font-bold leading-tight">
                      {c.mission.title}
                      <span className="block text-muted">+{c.points} puntos</span>
                    </span>
                    <button
                      onClick={() => run(c.id, () => validateAction(c.id, false))}
                      disabled={busy === c.id}
                      className="min-h-11 rounded-xl bg-surface-2 px-3 text-sm font-extrabold"
                    >
                      Rechazar
                    </button>
                    <button
                      onClick={() => run(c.id, () => validateAction(c.id, true))}
                      disabled={busy === c.id}
                      className="press min-h-11 rounded-xl bg-ok px-3 text-sm font-extrabold text-white [--press-shadow:#166534]"
                    >
                      Validar
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="mt-5 flex items-center justify-between md:mt-0">
            <h2 className="font-display text-[22px] font-extrabold">Misiones de hoy</h2>
            <span className="text-[13px] font-extrabold text-muted">
              {me.doneToday} de {me.dueToday} hechas
            </span>
          </div>
          <div
            className="mt-2 h-2.5 overflow-hidden rounded-full bg-line"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={me.dueToday}
            aria-valuenow={me.doneToday}
            aria-label="Progreso de hoy"
          >
            <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${me.dueToday ? (me.doneToday / me.dueToday) * 100 : 0}%` }} />
          </div>
          {data.nextTier && me.streak > 0 && (
            <p className="mt-2 text-[13px] font-bold text-muted">
              {data.nextTier.inDays === 1 ? "Mañana" : `En ${data.nextTier.inDays} días`} tu racha pasa a x{data.nextTier.multiplier}
            </p>
          )}

          {error && (
            <p role="alert" className="mt-3 rounded-2xl bg-surface px-3 py-2 text-sm font-bold text-danger">
              {error}
            </p>
          )}

          {data.missionsToday.length === 0 ? (
            <p className="mt-4 rounded-3xl bg-surface p-6 text-center font-bold text-muted">
              Hoy no tienes misiones. Crea alguna en la pestaña Misiones.
            </p>
          ) : (
            <ul className="mt-3 grid grid-cols-2 gap-3 2xl:grid-cols-3">
              {data.missionsToday.map((s) => {
                const m = s.mission;
                const done = s.today === "approved";
                const pending = s.today === "pending";
                const rejected = s.today === "rejected";
                const isSteps = m.kind === "steps";
                const sub = isSteps
                  ? `${data.stepsToday.toLocaleString("es-ES")} de ${(m.target ?? 0).toLocaleString("es-ES")}`
                  : m.frequency.type === "weekly"
                    ? `${s.weekCount} de ${s.weekTarget} esta semana`
                    : m.assignee === "both"
                      ? "Los dos"
                      : "Solo tú";
                return (
                  <li key={m.id}>
                    <div
                      className={`press relative flex h-full min-h-[150px] flex-col gap-1 rounded-3xl border-[3px] bg-surface p-3 ${
                        done ? "border-ok [--press-shadow:var(--ok-soft)]" : pending ? "border-gold" : "border-transparent"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span
                          className="flex size-[46px] items-center justify-center rounded-2xl text-white"
                          style={{ background: CATEGORY_COLORS[m.category] ?? FALLBACK_TILE }}
                        >
                          <Icon name={m.icon} size={26} stroke={2.4} />
                        </span>
                        <span className="font-display text-lg font-extrabold">+{m.points}</span>
                      </div>
                      <h3 className="text-base font-extrabold leading-tight">{m.title}</h3>
                      <p className="text-[12.5px] font-bold text-muted">{sub}</p>
                      {isSteps && (
                        <div className="h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
                          <div className="h-full rounded-full bg-me-fill" style={{ width: `${Math.min(100, (data.stepsToday / (m.target || 1)) * 100)}%` }} />
                        </div>
                      )}
                      <div className="mt-auto flex items-center justify-between gap-1 pt-1">
                        {done ? (
                          <span className="pop-in rounded-full bg-ok-soft px-2.5 py-1 text-xs font-extrabold text-ok-ink">Hecha</span>
                        ) : pending ? (
                          <span className="rounded-full bg-warn-soft px-2.5 py-1 text-xs font-extrabold text-warn-ink">Por validar</span>
                        ) : rejected ? (
                          <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-extrabold text-danger">Rechazada</span>
                        ) : (
                          <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-extrabold text-muted">Pendiente</span>
                        )}
                        {s.canComplete ? (
                          <button
                            onClick={(e) => (isSteps ? stepsDialog.current?.showModal() : complete(m.id, e.currentTarget))}
                            disabled={busy === m.id}
                            aria-label={isSteps ? `Apuntar pasos de ${m.title}` : `Completar ${m.title}`}
                            className="press flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-ink [--press-shadow:var(--primary-press)] disabled:opacity-60"
                          >
                            <Icon name={isSteps ? "plus" : "check"} size={24} stroke={3} />
                          </button>
                        ) : (
                          !isSteps && (
                            <button
                              onClick={() => run(m.id, () => undoAction(m.id))}
                              disabled={busy === m.id}
                              aria-label={`Deshacer ${m.title}`}
                              className="flex size-11 items-center justify-center rounded-2xl text-muted hover:bg-surface-2"
                            >
                              <Icon name="undo" size={20} />
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {data.challenges.map((c) => (
            <div
              key={c.mission.id}
              className="press mt-3 flex items-center gap-3 rounded-[22px] bg-primary p-3 text-primary-ink [--press-shadow:var(--primary-press)]"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold text-[#1E1B3A]">
                <Icon name="trophy" size={22} stroke={2.4} />
              </span>
              <div className="flex-1">
                <p className="text-[15px] font-extrabold">{c.mission.title}</p>
                <p className="text-[12.5px] font-bold opacity-90">
                  {c.weekCount} de {c.target} esta semana
                </p>
              </div>
              <span className="font-display text-lg font-extrabold">+{c.mission.points}</span>
              {c.canComplete && (
                <button
                  onClick={(e) => complete(c.mission.id, e.currentTarget)}
                  disabled={busy === c.mission.id}
                  aria-label={`Sumar un día a ${c.mission.title}`}
                  className="flex size-11 items-center justify-center rounded-2xl bg-white/20 hover:bg-white/30"
                >
                  <Icon name="plus" size={22} stroke={3} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <dialog
        ref={stepsDialog}
        aria-labelledby="steps-title"
        className="m-auto w-[min(92vw,360px)] rounded-3xl bg-surface p-5 text-ink backdrop:bg-black/50"
      >
        <form
          method="dialog"
          onSubmit={(e) => {
            const steps = Number(new FormData(e.currentTarget).get("steps"));
            const btn = stepsMission ? document.activeElement : null;
            run("steps", () => stepsAction(steps), (d) => {
              const done = (d as { completed: string[] }).completed;
              if (done.length && btn instanceof HTMLElement) {
                celebrate(btn);
                setMood("happy");
                setTimeout(() => setMood("idle"), 1900);
                setToast({ text: `¡${done[0]} completada!`, key: Date.now() });
              }
            });
          }}
        >
          <h2 id="steps-title" className="font-display text-xl font-extrabold">
            Pasos de hoy
          </h2>
          <p className="mt-1 text-sm font-bold text-muted">Apúntalos a mano. Más adelante podrá enviarlos un Atajo del iPhone.</p>
          <label className="mt-4 block text-sm font-extrabold" htmlFor="steps">
            Pasos
          </label>
          <input
            id="steps"
            name="steps"
            type="number"
            inputMode="numeric"
            min={0}
            max={200000}
            required
            defaultValue={data.stepsToday || ""}
            className="mt-1 w-full rounded-2xl border-2 border-line bg-bg px-4 py-3 text-lg font-extrabold"
          />
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => stepsDialog.current?.close()} className="min-h-11 rounded-2xl px-4 font-extrabold text-muted">
              Cancelar
            </button>
            <button type="submit" className="press min-h-11 rounded-2xl bg-primary px-5 font-extrabold text-primary-ink [--press-shadow:var(--primary-press)]">
              Guardar
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
