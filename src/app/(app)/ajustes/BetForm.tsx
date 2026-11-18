"use client";

import { useState, useTransition } from "react";
import { setBetAction } from "@/app/actions";

export function BetForm({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  return (
    <form
      className="mt-3 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await setBetAction(value);
          setSaved(r.ok);
        });
      }}
    >
      <label htmlFor="bet" className="sr-only">
        Apuesta
      </label>
      <input
        id="bet"
        value={value}
        maxLength={120}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(false);
        }}
        placeholder="Quien pierda invita a cenar"
        className="min-w-0 flex-1 rounded-2xl border-2 border-line bg-bg px-3 py-2.5 font-bold"
      />
      <button disabled={pending} className="min-h-11 rounded-2xl bg-primary px-4 font-extrabold text-primary-ink disabled:opacity-60">
        {saved ? "Guardada" : "Guardar"}
      </button>
    </form>
  );
}
