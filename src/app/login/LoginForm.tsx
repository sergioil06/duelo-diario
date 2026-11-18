"use client";

import { useActionState } from "react";
import { login } from "@/app/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action} className="press mt-6 w-full max-w-sm rounded-[28px] bg-surface p-5">
      <label htmlFor="username" className="block text-sm font-extrabold">
        Usuario
      </label>
      <input
        id="username"
        name="username"
        autoComplete="username"
        autoCapitalize="none"
        required
        className="mt-1 w-full rounded-2xl border-2 border-line bg-bg px-4 py-3 font-bold"
      />
      <label htmlFor="password" className="mt-4 block text-sm font-extrabold">
        Contraseña
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        className="mt-1 w-full rounded-2xl border-2 border-line bg-bg px-4 py-3 font-bold"
      />
      {state?.error && (
        <p role="alert" className="mt-3 text-sm font-bold text-danger">
          {state.error}
        </p>
      )}
      <button
        disabled={pending}
        className="press mt-5 min-h-12 w-full rounded-2xl bg-primary font-display text-lg font-extrabold text-primary-ink [--press-shadow:var(--primary-press)] disabled:opacity-60"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
      <p className="mt-3 text-center text-xs font-bold text-muted">La sesión se queda abierta en este móvil.</p>
    </form>
  );
}
