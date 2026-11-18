"use client";

import { useEffect, useState } from "react";

type Theme = "system" | "light" | "dark";

function applyTheme(t: Theme) {
  const resolved = t === "system" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : t;
  document.documentElement.dataset.theme = resolved;
}

export function Preferences() {
  const [theme, setTheme] = useState<Theme>("system");
  const [sound, setSound] = useState(false);

  useEffect(() => {
    try {
      setTheme((localStorage.getItem("theme") as Theme) ?? "system");
      setSound(localStorage.getItem("sound") === "on");
    } catch {}
  }, []);

  return (
    <div className="mt-3 space-y-4">
      <fieldset>
        <legend className="text-sm font-extrabold">Tema</legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(
            [
              ["system", "Auto"],
              ["light", "Claro"],
              ["dark", "Oscuro"],
            ] as const
          ).map(([v, l]) => (
            <button
              key={v}
              type="button"
              aria-pressed={theme === v}
              onClick={() => {
                setTheme(v);
                try {
                  localStorage.setItem("theme", v);
                } catch {}
                applyTheme(v);
              }}
              className={`min-h-11 rounded-2xl text-sm font-extrabold ${theme === v ? "bg-primary text-primary-ink" : "bg-surface-2 text-muted"}`}
            >
              {l}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="flex min-h-11 items-center justify-between rounded-2xl bg-surface-2 px-4">
        <span className="font-extrabold">Sonido al completar</span>
        <input
          type="checkbox"
          checked={sound}
          onChange={(e) => {
            setSound(e.target.checked);
            try {
              localStorage.setItem("sound", e.target.checked ? "on" : "off");
            } catch {}
          }}
          className="size-6 accent-[var(--primary)]"
        />
      </label>
    </div>
  );
}
