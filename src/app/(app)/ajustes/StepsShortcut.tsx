"use client";

import { useEffect, useState, useTransition } from "react";
import { regenerateStepsTokenAction } from "@/app/actions";

export function StepsShortcut({ token: initial }: { token: string | null }) {
  const [token, setToken] = useState(initial);
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [pending, start] = useTransition();
  // Se calcula tras montar para que el HTML del servidor y el del cliente coincidan.
  const [url, setUrl] = useState("/api/steps");
  useEffect(() => setUrl(`${location.origin}/api/steps`), []);

  const copy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
    } catch {
      setCopied(null);
    }
  };

  return (
    <div className="mt-3 space-y-3 text-sm font-bold">
      <ol className="list-decimal space-y-1.5 pl-5 text-muted">
        <li>En el iPhone, abre Atajos → Automatización → Nueva → «Hora del día» (por ejemplo 23:30, diariamente, sin preguntar).</li>
        <li>Añade «Buscar muestras de salud»: Pasos, fecha de inicio «hoy», agrupar por día. Después «Calcular estadísticas»: suma.</li>
        <li>Añade «Obtener contenido de URL» con la dirección de abajo, método POST, cabecera <code>Authorization</code> = <code>Bearer</code> + espacio + tu token, y cuerpo JSON con el campo <code>steps</code> igual a la suma.</li>
      </ol>
      <div className="rounded-2xl bg-surface-2 p-3">
        <p className="text-xs text-muted">Dirección</p>
        <div className="flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate">{url}</code>
          <button onClick={() => copy("url", url)} className="min-h-10 rounded-xl px-3 font-extrabold text-primary">
            {copied === "url" ? "Copiada" : "Copiar"}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted">Tu token (es como una contraseña, no lo compartas)</p>
        <div className="flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate">{token ? (show ? token : "•".repeat(24)) : "Sin token"}</code>
          {token && (
            <>
              <button onClick={() => setShow(!show)} className="min-h-10 rounded-xl px-2 font-extrabold text-muted">
                {show ? "Ocultar" : "Ver"}
              </button>
              <button onClick={() => copy("token", token)} className="min-h-10 rounded-xl px-2 font-extrabold text-primary">
                {copied === "token" ? "Copiado" : "Copiar"}
              </button>
            </>
          )}
        </div>
      </div>
      <button
        onClick={() =>
          start(async () => {
            const r = await regenerateStepsTokenAction();
            if (r.ok) {
              setToken(r.data);
              setShow(true);
            }
          })
        }
        disabled={pending}
        className="min-h-11 rounded-2xl bg-surface-2 px-4 font-extrabold text-muted"
      >
        {token ? "Generar un token nuevo" : "Generar token"}
      </button>
      <p className="text-xs text-muted">En Android no hay forma fiable de leer los pasos desde una web (Google está cerrando la API de Google Fit), así que allí se apuntan a mano.</p>
    </div>
  );
}
