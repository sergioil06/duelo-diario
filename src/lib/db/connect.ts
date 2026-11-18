import { mkdirSync } from "node:fs";
import path from "node:path";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { migrate as migratePostgres } from "drizzle-orm/postgres-js/migrator";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { PGlite } from "@electric-sql/pglite";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Con DATABASE_URL (Supabase u otro Postgres) usa postgres-js.
 * Sin ella, usa PGlite: un Postgres embebido en ./.data para desarrollo local.
 */
export type DB = ReturnType<typeof drizzlePglite<typeof schema>>;

const migrationsFolder = path.join(process.cwd(), "drizzle");

export async function createDb(): Promise<DB> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const client = postgres(url, { prepare: false, max: 5 });
    const db = drizzlePostgres(client, { schema });
    if (process.env.AUTO_MIGRATE !== "false") await migratePostgres(db, { migrationsFolder });
    return db as unknown as DB;
  }
  const dir = process.env.PGLITE_DIR ?? path.join(process.cwd(), ".data", "pglite");
  if (dir !== ":memory:") mkdirSync(dir, { recursive: true });
  const client = new PGlite(dir === ":memory:" ? undefined : dir);
  const db = drizzlePglite(client, { schema });
  await migratePglite(db, { migrationsFolder });
  return db;
}
