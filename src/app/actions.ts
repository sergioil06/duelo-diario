"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { endSession, requireUser, startSession } from "@/lib/auth/session";
import { getDb, schema } from "@/lib/db";
import { completeMission, GameError, logSteps, setSetting, undoMission, validateCompletion } from "@/lib/game";
import { ICON_KEYS } from "@/lib/icons";

type Result<T = unknown> = { ok: true; data: T } | { ok: false; error: string };

async function wrap<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    const data = await fn();
    revalidatePath("/", "layout");
    return { ok: true, data };
  } catch (e) {
    if (e instanceof GameError) return { ok: false, error: e.message };
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Datos no válidos" };
    throw e;
  }
}

/* ---------- Login ---------- */

// Freno simple a la fuerza bruta: 5 intentos fallidos por usuario cada 10 min.
const attempts = new Map<string, { n: number; until: number }>();
let dummyHash: string | undefined;

export async function login(_: unknown, form: FormData): Promise<{ error?: string }> {
  const username = String(form.get("username") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const a = attempts.get(username);
  if (a && a.n >= 5 && a.until > Date.now()) return { error: "Demasiados intentos. Prueba en unos minutos." };

  const db = await getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username));
  // Comparamos siempre para no revelar si el usuario existe por el tiempo de respuesta.
  const hash = user?.passwordHash ?? (dummyHash ??= await bcrypt.hash("no-existe", 12));
  const valid = await bcrypt.compare(password, hash);
  if (!user || !valid) {
    const prev = a && a.until > Date.now() ? a.n : 0;
    attempts.set(username, { n: prev + 1, until: Date.now() + 10 * 60_000 });
    return { error: "Usuario o contraseña incorrectos" };
  }
  attempts.delete(username);
  await startSession(user);
  redirect("/");
}

export async function logout() {
  await endSession();
  redirect("/login");
}

/* ---------- Misiones del día ---------- */

export async function completeAction(missionId: string) {
  const me = await requireUser();
  return wrap(async () => {
    const r = await completeMission(me, z.string().uuid().parse(missionId));
    return { points: r.award.points, multiplier: r.award.multiplier, pending: r.status === "pending" };
  });
}

export async function undoAction(missionId: string) {
  const me = await requireUser();
  return wrap(() => undoMission(me, z.string().uuid().parse(missionId)));
}

export async function validateAction(completionId: string, approve: boolean) {
  const me = await requireUser();
  return wrap(() => validateCompletion(me, z.string().uuid().parse(completionId), approve));
}

export async function stepsAction(steps: number) {
  const me = await requireUser();
  return wrap(() => logSteps(me, z.number().int().min(0).max(200_000).parse(steps)));
}

export async function setBetAction(bet: string) {
  await requireUser();
  return wrap(() => setSetting("bet", z.string().max(120).parse(bet.trim())));
}

/* ---------- Gestión de misiones ---------- */

const MissionInput = z
  .object({
    title: z.string().trim().min(2, "Ponle un nombre").max(60),
    icon: z.enum(ICON_KEYS),
    category: z.string().trim().min(1).max(30),
    points: z.coerce.number().int().min(1, "Mínimo 1 punto").max(1000),
    freqType: z.enum(["daily", "weekdays", "weekly"]),
    days: z.array(z.coerce.number().int().min(1).max(7)).default([]),
    times: z.coerce.number().int().min(1).max(7).default(1),
    assignee: z.string().min(1),
    requiresValidation: z.boolean(),
    kind: z.enum(["check", "steps"]),
    target: z.coerce.number().int().min(100).max(100_000).nullable(),
    isChallenge: z.boolean(),
  })
  .refine((v) => v.freqType !== "weekdays" || v.days.length > 0, { message: "Elige al menos un día" })
  .refine((v) => v.kind !== "steps" || v.target !== null, { message: "Indica el objetivo de pasos" });

function parseMissionForm(form: FormData) {
  const v = MissionInput.parse({
    title: form.get("title"),
    icon: form.get("icon"),
    category: form.get("category"),
    points: form.get("points"),
    freqType: form.get("freqType"),
    days: form.getAll("days"),
    times: form.get("times") || 1,
    assignee: form.get("assignee"),
    requiresValidation: form.get("requiresValidation") === "on",
    kind: form.get("kind") === "steps" ? "steps" : "check",
    target: form.get("kind") === "steps" ? form.get("target") : null,
    isChallenge: form.get("isChallenge") === "on",
  });
  const frequency =
    v.freqType === "daily"
      ? ({ type: "daily" } as const)
      : v.freqType === "weekdays"
        ? ({ type: "weekdays", days: [...new Set(v.days)].sort() } as const)
        : ({ type: "weekly", times: v.times } as const);
  return {
    title: v.title,
    icon: v.icon,
    category: v.category,
    points: v.points,
    frequency,
    assignee: v.assignee,
    requiresValidation: v.requiresValidation,
    kind: v.kind,
    target: v.target,
    isChallenge: v.isChallenge,
  };
}

async function checkAssignee(assignee: string) {
  if (assignee === "both") return;
  const db = await getDb();
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, assignee));
  if (!u) throw new GameError("Persona no válida");
}

export async function saveMissionAction(id: string | null, _: unknown, form: FormData): Promise<{ error?: string }> {
  const me = await requireUser();
  const r = await wrap(async () => {
    const values = parseMissionForm(form);
    await checkAssignee(values.assignee);
    const db = await getDb();
    if (id) await db.update(schema.missions).set(values).where(eq(schema.missions.id, z.string().uuid().parse(id)));
    else await db.insert(schema.missions).values({ ...values, createdBy: me.id });
  });
  if (!r.ok) return { error: r.error };
  redirect("/misiones");
}

export async function toggleMissionAction(id: string, active: boolean) {
  await requireUser();
  return wrap(async () => {
    const db = await getDb();
    await db.update(schema.missions).set({ active }).where(eq(schema.missions.id, z.string().uuid().parse(id)));
  });
}

export async function deleteMissionAction(id: string) {
  await requireUser();
  return wrap(async () => {
    const db = await getDb();
    // Borra también su historial (cascade). Para conservar puntos, mejor desactivar.
    await db.delete(schema.missions).where(eq(schema.missions.id, z.string().uuid().parse(id)));
  });
}

/* ---------- Panel de admin: cuentas ---------- */

const AccountInput = z.object({
  id: z.string(),
  username: z.string().trim().toLowerCase().min(2).max(40),
  displayName: z.string().trim().min(1).max(40),
  password: z.string().max(200),
});

export async function saveAccountAction(_: unknown, form: FormData): Promise<{ error?: string; ok?: boolean }> {
  const me = await requireUser();
  if (me.role !== "admin") return { error: "Solo el administrador puede cambiar cuentas" };
  const v = AccountInput.safeParse(Object.fromEntries(form));
  if (!v.success) return { error: v.error.issues[0]?.message };
  if (v.data.password && v.data.password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres" };
  const db = await getDb();
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, v.data.id));
  if (!u) return { error: "Cuenta no encontrada" };
  const [clash] = await db.select().from(schema.users).where(eq(schema.users.username, v.data.username));
  if (clash && clash.id !== u.id) return { error: "Ese nombre de usuario ya está en uso" };
  await db
    .update(schema.users)
    .set({
      username: v.data.username,
      displayName: v.data.displayName,
      ...(v.data.password
        ? { passwordHash: await bcrypt.hash(v.data.password, 12), sessionVersion: u.sessionVersion + 1 }
        : {}),
    })
    .where(eq(schema.users.id, u.id));
  // Si el admin cambia su propia contraseña, renovamos su sesión para que no le eche.
  if (v.data.password && u.id === me.id) await startSession({ id: u.id, sessionVersion: u.sessionVersion + 1 });
  revalidatePath("/ajustes");
  return { ok: true };
}
