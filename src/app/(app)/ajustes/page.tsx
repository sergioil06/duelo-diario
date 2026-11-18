import { getDb, schema } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { logout } from "@/app/actions";
import { getSetting } from "@/lib/game";
import { localDate, weekStart } from "@/lib/domain/dates";
import { Preferences } from "./Preferences";
import { AccountForm } from "./AccountForm";
import { BetForm } from "./BetForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const me = await requireUser();
  const db = await getDb();
  const accounts = me.role === "admin" ? await db.select().from(schema.users).orderBy(schema.users.createdAt) : [];
  const bet = await getSetting<string>(`bet:${weekStart(localDate())}`, "");

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <h1 className="font-display text-[26px] font-extrabold">Ajustes</h1>

      <section className="press rounded-[28px] bg-surface p-5">
        <h2 className="font-display text-xl font-extrabold">Preferencias</h2>
        <Preferences />
      </section>

      <section className="press rounded-[28px] bg-surface p-5">
        <h2 className="font-display text-xl font-extrabold">Apuesta de la semana</h2>
        <p className="mt-1 text-sm font-bold text-muted">Opcional. Sale en el marcador y en el resultado de la semana. Cada lunes empieza una nueva.</p>
        <BetForm initial={bet} />
      </section>

      {me.role === "admin" && (
        <section className="press rounded-[28px] bg-surface p-5">
          <h2 className="font-display text-xl font-extrabold">Cuentas (solo admin)</h2>
          <p className="mt-1 text-sm font-bold text-muted">
            Deja la contraseña vacía para no cambiarla. Al cambiarla se cierra la sesión en los demás móviles.
          </p>
          <div className="mt-4 space-y-4">
            {accounts.map((u) => (
              <AccountForm key={u.id} account={{ id: u.id, username: u.username, displayName: u.displayName, role: u.role }} />
            ))}
          </div>
        </section>
      )}

      <form action={logout}>
        <button className="min-h-12 w-full rounded-2xl bg-surface-2 font-extrabold text-danger">Cerrar sesión</button>
      </form>
    </div>
  );
}
