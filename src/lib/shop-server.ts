import "server-only";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import type { User } from "@/lib/db/schema";
import { coinBalance } from "@/lib/domain/points";
import {
  checkPurchase, cleanEquipped, defaultAppearance, equip, sanitizeAppearance,
  type Appearance, type Equipped, type Slot,
} from "@/lib/domain/shop";
import { GameError } from "@/lib/errors";

const { avatars, purchases, completions } = schema;

export interface AvatarState {
  userId: string;
  appearance: Appearance;
  equipped: Equipped;
}

function variant(u: Pick<User, "role">) {
  return u.role === "admin" ? "a" : "b";
}

export async function getAvatar(u: Pick<User, "id" | "role">): Promise<AvatarState> {
  const db = await getDb();
  const [row] = await db.select().from(avatars).where(eq(avatars.userId, u.id));
  const owned = (await db.select({ itemId: purchases.itemId }).from(purchases).where(eq(purchases.userId, u.id))).map((p) => p.itemId);
  const def = defaultAppearance(variant(u));
  return {
    userId: u.id,
    appearance: row ? sanitizeAppearance(row.appearance, def) : def,
    equipped: cleanEquipped(row?.equipped ?? {}, owned),
  };
}

export async function getCoins(userId: string) {
  const db = await getDb();
  const [mine, spent] = await Promise.all([
    db.select().from(completions).where(eq(completions.userId, userId)),
    db.select().from(purchases).where(eq(purchases.userId, userId)),
  ]);
  return { coins: coinBalance(mine, spent.map((s) => ({ userId, coins: s.price })), userId), owned: spent.map((s) => s.itemId) };
}

export async function getShop(me: User) {
  const [{ coins, owned }, avatar] = await Promise.all([getCoins(me.id), getAvatar(me)]);
  return { coins, owned, avatar };
}

export async function buyItem(me: User, itemId: string) {
  const db = await getDb();
  return db.transaction(async (tx) => {
    const [mine, spent] = await Promise.all([
      tx.select().from(completions).where(eq(completions.userId, me.id)),
      tx.select().from(purchases).where(eq(purchases.userId, me.id)),
    ]);
    const coins = coinBalance(mine, spent.map((s) => ({ userId: me.id, coins: s.price })), me.id);
    const check = checkPurchase(itemId, spent.map((s) => s.itemId), coins);
    if (!check.ok) throw new GameError(check.reason);
    await tx.insert(purchases).values({ userId: me.id, itemId, price: check.price });
    return { coins: coins - check.price };
  });
}

async function saveAvatar(userId: string, appearance: Appearance, equipped: Equipped) {
  const db = await getDb();
  await db
    .insert(avatars)
    .values({ userId, appearance, equipped })
    .onConflictDoUpdate({ target: avatars.userId, set: { appearance, equipped, updatedAt: new Date() } });
}

export async function equipItem(me: User, slot: Slot, itemId: string | null) {
  const [avatar, { owned }] = await Promise.all([getAvatar(me), getCoins(me.id)]);
  let next: Equipped;
  try {
    next = equip(avatar.equipped, slot, itemId, owned);
  } catch (e) {
    throw new GameError((e as Error).message);
  }
  await saveAvatar(me.id, avatar.appearance, next);
  return next;
}

export async function updateAppearance(me: User, input: Partial<Appearance>) {
  const avatar = await getAvatar(me);
  const appearance = sanitizeAppearance(input, avatar.appearance);
  await saveAvatar(me.id, appearance, avatar.equipped);
  return appearance;
}
