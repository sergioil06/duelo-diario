"use client";

import { useActionState } from "react";
import { saveAccountAction } from "@/app/actions";

const field = "mt-1 w-full rounded-2xl border-2 border-line bg-bg px-3 py-2.5 font-bold";

export function AccountForm({ account }: { account: { id: string; username: string; displayName: string; role: string } }) {
  const [state, action, pending] = useActionState(saveAccountAction, {});
  const p = `acc-${account.id}`;
  return (
    <form action={action} className="rounded-2xl bg-surface-2 p-4">
      <input type="hidden" name="id" value={account.id} />
      <p className="text-sm font-extrabold text-muted">{account.role === "admin" ? "Administrador" : "Miembro"}</p>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${p}-name`} className="text-sm font-extrabold">
            Nombre visible
          </label>
          <input id={`${p}-name`} name="displayName" defaultValue={account.displayName} required className={field} />
        </div>
        <div>
          <label htmlFor={`${p}-user`} className="text-sm font-extrabold">
            Usuario
          </label>
          <input id={`${p}-user`} name="username" defaultValue={account.username} required autoCapitalize="none" className={field} />
        </div>
      </div>
      <label htmlFor={`${p}-pass`} className="mt-3 block text-sm font-extrabold">
        Nueva contraseña
      </label>
      <input id={`${p}-pass`} name="password" type="password" autoComplete="new-password" minLength={8} placeholder="Sin cambios" className={field} />
      <div className="mt-3 flex items-center justify-end gap-3">
        {state?.error && <span role="alert" className="text-sm font-bold text-danger">{state.error}</span>}
        {state?.ok && <span role="status" className="text-sm font-bold text-ok">Guardado</span>}
        <button disabled={pending} className="min-h-11 rounded-2xl bg-primary px-5 font-extrabold text-primary-ink disabled:opacity-60">
          Guardar
        </button>
      </div>
    </form>
  );
}
