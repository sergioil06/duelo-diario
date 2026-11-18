/**
 * Crea o actualiza las dos cuentas desde users.config.json.
 *
 *   npm run users
 *
 * El archivo lleva las contraseñas en claro solo mientras lo editas: este script
 * guarda únicamente el hash bcrypt en la base de datos. Puedes borrar el campo
 * "password" después (si no lo pones, la contraseña no se cambia).
 */
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createDb } from "../src/lib/db/connect";
import { users } from "../src/lib/db/schema";
import { seedMissions } from "../src/lib/seed";

const UserSchema = z.object({
  id: z.string().regex(/^[a-z0-9_-]{2,20}$/, "id: minúsculas, números, - o _"),
  username: z.string().min(2).max(40),
  displayName: z.string().min(1).max(40),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").optional(),
  role: z.enum(["admin", "member"]).default("member"),
});
const ConfigSchema = z.object({ users: z.array(UserSchema).length(2, "Debe haber exactamente 2 usuarios") });

async function main() {
  const file = process.argv[2] ?? "users.config.json";
  const config = ConfigSchema.parse(JSON.parse(readFileSync(file, "utf8")));
  const db = await createDb();

  for (const u of config.users) {
    const [existing] = await db.select().from(users).where(eq(users.id, u.id));
    if (!existing) {
      if (!u.password) throw new Error(`Falta "password" para crear a ${u.id}`);
      await db.insert(users).values({
        id: u.id,
        username: u.username.toLowerCase(),
        displayName: u.displayName,
        role: u.role,
        passwordHash: await bcrypt.hash(u.password, 12),
        stepsToken: randomBytes(24).toString("base64url"),
      });
      console.log(`✓ Creado ${u.username}`);
    } else {
      await db
        .update(users)
        .set({
          username: u.username.toLowerCase(),
          displayName: u.displayName,
          role: u.role,
          ...(u.password
            ? { passwordHash: await bcrypt.hash(u.password, 12), sessionVersion: existing.sessionVersion + 1 }
            : {}),
        })
        .where(eq(users.id, u.id));
      console.log(`✓ Actualizado ${u.username}${u.password ? " (contraseña nueva, sesiones cerradas)" : ""}`);
    }
  }
  const created = await seedMissions(db, config.users[0].id);
  if (created) console.log(`✓ Añadidas ${created} misiones de ejemplo`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e instanceof z.ZodError ? e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n") : e);
  process.exit(1);
});
