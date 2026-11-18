import { getDb, schema } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { logout } from "@/app/actions";
import { getSetting } from "@/lib/game";
import { localDate, weekStart } from "@/lib/domain/dates";
import { Preferences } from "./Preferences";
import { AccountForm } from "./AccountForm";
import { BetForm } from "./BetForm";
import { Notifications } from "./Notifications";
import { StepsShortcut } from "./StepsShortcut";
import { InstallApp } from "./InstallApp";
import { getPrefs } from "@/lib/push";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const me = await requireUser();
  const db = await getDb();
  const accounts = me.role === "admin" ? await db.select().from(schema.users).orderBy(schema.users.createdAt) : [];
  const bet = await getSetting<string>(`bet:${weekStart(localDate())}`, "");
  const prefs = await getPrefs(me.id);
  const [row] = await db.select({ stepsToken: schema.users.stepsToken }).from(schema.users).where(eq(schema.users.id, me.id));
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <h1 className="font-display text-[26px] font-extrabold">Ajustes</h1>

      <section className="press rounded-[28px] bg-surface p-5">
        <h2 className="font-display text-xl font-extrabold">Preferencias</h2>
        <Preferences />
      </section>

      <section className="press rounded-[28px] bg-surface p-5">
        <h2 className="font-display text-xl font-extrabold">Avisos</h2>
        <p className="mt-1 text-sm font-bold text-muted">Recordatorios de misiones pendientes y novedades de tu pareja. Se activan en cada móvil por separado.</p>
        <Notifications prefs={{ hours: prefs.hours, partnerActivity: prefs.partnerActivity }} vapidKey={vapidKey} />
      </section>

      <section className="press rounded-[28px] bg-surface p-5">
        <h2 className="font-display text-xl font-extrabold">Instalar la app</h2>
        <InstallApp />
      </section>

      <section className="press rounded-[28px] bg-surface p-5">
        <h2 className="font-display text-xl font-extrabold">Pasos automáticos (iPhone)</h2>
        <p className="mt-1 text-sm font-bold text-muted">Con un Atajo de iOS la app recibe tus pasos de Salud cada noche, sin apuntarlos a mano.</p>
        <StepsShortcut token={row?.stepsToken ?? null} />
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
