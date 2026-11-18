"use client";

import { useEffect, useState } from "react";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function InstallApp() {
  const [mode, setMode] = useState<"installed" | "prompt" | "ios" | "other">("other");
  const [evt, setEvt] = useState<BIPEvent | null>(null);

  useEffect(() => {
    const standalone = matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone;
    if (standalone) return setMode("installed");
    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) setMode("ios");
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
      setMode("prompt");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (mode === "installed") return <p className="mt-2 text-sm font-bold text-ok">Ya la estás usando como app instalada.</p>;
  if (mode === "prompt")
    return (
      <button
        onClick={async () => {
          await evt?.prompt();
          setMode("other");
        }}
        className="press mt-3 min-h-11 rounded-2xl bg-primary px-5 font-extrabold text-primary-ink [--press-shadow:var(--primary-press)]"
      >
        Instalar en este dispositivo
      </button>
    );
  return (
    <p className="mt-2 text-sm font-bold text-muted">
      {mode === "ios"
        ? "En Safari: botón Compartir → «Añadir a pantalla de inicio»."
        : "En Chrome para Android: menú ⋮ → «Instalar aplicación» o «Añadir a pantalla de inicio»."}
    </p>
  );
}
