import "server-only";
import { createDb, type DB } from "./connect";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { __db?: Promise<DB> };

export function getDb(): Promise<DB> {
  globalForDb.__db ??= createDb();
  return globalForDb.__db;
}

export { schema };
