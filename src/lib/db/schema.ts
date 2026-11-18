import { boolean, index, integer, jsonb, pgTable, real, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import type { Frequency } from "@/lib/domain/missions";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "member"] }).notNull().default("member"),
  /** Cambia al cambiar la contraseña: invalida sesiones viejas. */
  sessionVersion: integer("session_version").notNull().default(1),
  /** Token para que un Atajo de iOS envíe los pasos. */
  stepsToken: text("steps_token"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const missions = pgTable("missions", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  icon: text("icon").notNull(),
  category: text("category").notNull(),
  points: integer("points").notNull(),
  frequency: jsonb("frequency").$type<Frequency>().notNull(),
  assignee: text("assignee").notNull().default("both"),
  requiresValidation: boolean("requires_validation").notNull().default(false),
  kind: text("kind", { enum: ["check", "steps"] }).notNull().default("check"),
  target: integer("target"),
  isChallenge: boolean("is_challenge").notNull().default(false),
  active: boolean("active").notNull().default(true),
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const completions = pgTable(
  "completions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    missionId: uuid("mission_id")
      .notNull()
      .references(() => missions.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    /** Fecha local Europe/Madrid YYYY-MM-DD. */
    date: text("date").notNull(),
    status: text("status", { enum: ["approved", "pending", "rejected"] }).notNull(),
    points: integer("points").notNull(),
    coins: integer("coins").notNull(),
    multiplier: real("multiplier").notNull().default(1),
    validatedBy: text("validated_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("completions_unique_day").on(t.missionId, t.userId, t.date), index("completions_user_date").on(t.userId, t.date)],
);

export const stepLogs = pgTable(
  "step_logs",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    date: text("date").notNull(),
    steps: integer("steps").notNull(),
    source: text("source").notNull().default("manual"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("step_logs_user_date").on(t.userId, t.date)],
);

/** Ajustes compartidos (apuesta de la semana, etc.). */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
});

export type User = typeof users.$inferSelect;
export type Mission = typeof missions.$inferSelect;
export type Completion = typeof completions.$inferSelect;

/** Compras de la tienda: restan monedas, nunca puntos de ranking. */
export const purchases = pgTable(
  "purchases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    itemId: text("item_id").notNull(),
    price: integer("price").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("purchases_user_item").on(t.userId, t.itemId)],
);

/** Apariencia y objetos equipados de cada avatar. */
export const avatars = pgTable("avatars", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id),
  appearance: jsonb("appearance").$type<import("@/lib/domain/shop").Appearance>().notNull(),
  equipped: jsonb("equipped").$type<import("@/lib/domain/shop").Equipped>().notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Suscripciones Web Push (una por móvil o navegador). */
export const pushSubscriptions = pgTable("push_subscriptions", {
  endpoint: text("endpoint").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
