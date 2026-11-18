import "server-only";
import * as webpush from "web-push";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { DEFAULT_PREFS, normalizePrefs, type NotifyPrefs } from "@/lib/domain/notify";

const { pushSubscriptions, settings } = schema;

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

let configured: boolean | null = null;
export function pushEnabled(): boolean {
  if (configured !== null) return configured;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return (configured = false);
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@example.com", pub, priv);
  return (configured = true);
}

export async function getPrefs(userId: string): Promise<NotifyPrefs> {
  const db = await getDb();
  const [row] = await db.select().from(settings).where(eq(settings.key, `notify:${userId}`));
  return row ? normalizePrefs(row.value) : DEFAULT_PREFS;
}

export async function savePrefs(userId: string, prefs: NotifyPrefs) {
  const db = await getDb();
  const value = normalizePrefs(prefs);
  await db.insert(settings).values({ key: `notify:${userId}`, value }).onConflictDoUpdate({ target: settings.key, set: { value } });
}

export async function saveSubscription(userId: string, sub: { endpoint: string; keys: { p256dh: string; auth: string } }) {
  const db = await getDb();
  const values = { endpoint: sub.endpoint, userId, p256dh: sub.keys.p256dh, auth: sub.keys.auth };
  await db.insert(pushSubscriptions).values(values).onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: values });
}

export async function removeSubscription(userId: string, endpoint: string) {
  const db = await getDb();
  const [row] = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  if (row?.userId === userId) await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
}

/** Envía a todos los dispositivos de una persona. Nunca lanza: un aviso fallido no rompe la app. */
export async function sendToUser(userId: string, payload: PushPayload): Promise<number> {
  if (!pushEnabled()) return 0;
  const db = await getDb();
  const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), { TTL: 3600 });
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        // 404/410: la suscripción ya no existe (desinstalada o permisos quitados).
        if (code === 404 || code === 410) await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, s.endpoint));
        else console.error("push", code ?? e);
      }
    }),
  );
  return sent;
}
