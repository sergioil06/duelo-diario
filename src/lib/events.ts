import "server-only";
import { after } from "next/server";
import type { User } from "@/lib/db/schema";
import { ne } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getPrefs, sendToUser } from "@/lib/push";

async function getPartner(userId: string) {
  const db = await getDb();
  const [p] = await db.select().from(schema.users).where(ne(schema.users.id, userId));
  return p ?? null;
}

/** Lanza un aviso después de responder, para no frenar la acción del usuario. */
function later(fn: () => Promise<unknown>) {
  try {
    after(() => fn().catch((e) => console.error("aviso", e)));
  } catch {
    // Fuera de una petición (scripts, tests): se envía sin esperar.
    void fn().catch((e) => console.error("aviso", e));
  }
}

export function onCompleted(me: User, title: string, points: number, pending: boolean) {
  later(async () => {
    const partner = await getPartner(me.id);
    if (!partner) return;
    if (pending) {
      await sendToUser(partner.id, { title: `${me.displayName} pide que valides`, body: `${title} · +${points}`, url: "/", tag: "validar" });
      return;
    }
    if ((await getPrefs(partner.id)).partnerActivity && points > 0)
      await sendToUser(partner.id, { title: `${me.displayName} suma +${points}`, body: `Ha completado: ${title}`, url: "/", tag: "actividad" });
  });
}

export function onValidated(me: User, ownerId: string, title: string, points: number, approved: boolean) {
  later(() =>
    sendToUser(ownerId, {
      title: approved ? `${me.displayName} ha validado tu misión` : `${me.displayName} ha rechazado tu misión`,
      body: approved ? `${title} · +${points} puntos` : `${title}. Puedes volver a marcarla cuando la hagas.`,
      url: "/",
      tag: "validacion",
    }),
  );
}
