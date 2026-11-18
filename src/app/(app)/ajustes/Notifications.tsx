"use client";

import { useEffect, useState, useTransition } from "react";
import { notifyPrefsAction, subscribePushAction, testPushAction, unsubscribePushAction } from "@/app/actions";
import { REMINDER_HOURS, type NotifyPrefs } from "@/lib/domain/notify";

type State = "loading" | "unsupported" | "ios-install" | "no-key" | "denied" | "off" | "on";

function urlBase64ToUint8Array(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export function Notifications({ prefs, vapidKey }: { prefs: NotifyPrefs; vapidKey: string | null }) {
  const [state, setState] = useState<State>("loading");
  const [hours, setHours] = useState(prefs.hours);
  const [partner, setPartner] = useState(prefs.partnerActivity);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    (async () => {
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const standalone = matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone;
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return setState(ios && !standalone ? "ios-install" : "unsupported");
      if (!vapidKey) return setState("no-key");
      if (Notification.permission === "denied") return setState("denied");
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      setState(sub ? "on" : "off");
    })().catch(() => setState("unsupported"));
  }, [vapidKey]);

  const enable = () =>
    start(async () => {
      try {
        const perm = await Notification.requestPermission();
        if (perm !== "granted") return setState(perm === "denied" ? "denied" : "off");
        const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
        await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidKey!) });
        const r = await subscribePushAction(sub.toJSON());
        if (!r.ok) return setMsg(r.error);
        setState("on");
        setMsg("Avisos activados en este dispositivo");
      } catch {
        setMsg("No se han podido activar los avisos en este navegador");
      }
    });

  const disable = () =>
    start(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await unsubscribePushAction(sub.endpoint);
        await sub.unsubscribe();
      }
      setState("off");
      setMsg("Avisos desactivados en este dispositivo");
    });

  const savePrefs = (h: number[], p: boolean) => start(async () => void (await notifyPrefsAction(h, p)));

  return (
    <div className="mt-3 space-y-4">
      {state === "ios-install" && (
        <p className="rounded-2xl bg-warn-soft p-3 text-sm font-bold text-warn-ink">
          En iPhone los avisos solo funcionan con la app instalada: en Safari pulsa Compartir y luego «Añadir a pantalla de inicio». Después ábrela desde el icono y vuelve aquí.
        </p>
      )}
      {state === "unsupported" && <p className="text-sm font-bold text-muted">Este navegador no admite notificaciones push.</p>}
      {state === "no-key" && (
        <p className="text-sm font-bold text-muted">Faltan las claves VAPID en el servidor. Mira el README, apartado «Notificaciones».</p>
      )}
      {state === "denied" && (
        <p className="text-sm font-bold text-muted">Has bloqueado las notificaciones. Actívalas en los ajustes del navegador o del móvil para esta app.</p>
      )}
      {(state === "off" || state === "on") && (
        <div className="flex flex-wrap gap-2">
          {state === "off" ? (
            <button onClick={enable} disabled={pending} className="press min-h-11 rounded-2xl bg-primary px-5 font-extrabold text-primary-ink [--press-shadow:var(--primary-press)]">
              Activar avisos en este móvil
            </button>
          ) : (
            <>
              <button
                onClick={() => start(async () => setMsg((await testPushAction()).ok ? "Aviso de prueba enviado" : "No se pudo enviar"))}
                disabled={pending}
                className="min-h-11 rounded-2xl bg-primary px-4 font-extrabold text-primary-ink"
              >
                Enviar prueba
              </button>
              <button onClick={disable} disabled={pending} className="min-h-11 rounded-2xl bg-surface-2 px-4 font-extrabold text-muted">
                Desactivar
              </button>
            </>
          )}
        </div>
      )}
      {msg && (
        <p role="status" className="text-sm font-bold text-muted">
          {msg}
        </p>
      )}

      <fieldset>
        <legend className="text-sm font-extrabold">Recordarme las misiones pendientes a las</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {REMINDER_HOURS.map((h) => {
            const on = hours.includes(h);
            return (
              <button
                key={h}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  const next = on ? hours.filter((x) => x !== h) : [...hours, h].sort((a, b) => a - b);
                  setHours(next);
                  savePrefs(next, partner);
                }}
                className={`min-h-10 rounded-full px-4 text-sm font-extrabold tabular-nums ${on ? "bg-primary text-primary-ink" : "bg-surface-2 text-muted"}`}
              >
                {String(h).padStart(2, "0")}:00
              </button>
            );
          })}
        </div>
      </fieldset>
      <label className="flex min-h-11 items-center justify-between gap-3 rounded-2xl bg-surface-2 px-4 py-2">
        <span>
          <span className="block font-extrabold">Avisarme cuando mi pareja sume puntos</span>
          <span className="block text-[13px] font-bold text-muted">Las peticiones de validación llegan siempre.</span>
        </span>
        <input
          type="checkbox"
          checked={partner}
          onChange={(e) => {
            setPartner(e.target.checked);
            savePrefs(hours, e.target.checked);
          }}
          className="size-6 accent-[var(--primary)]"
        />
      </label>
    </div>
  );
}
