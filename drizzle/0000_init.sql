CREATE TABLE "completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mission_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"date" text NOT NULL,
	"status" text NOT NULL,
	"points" integer NOT NULL,
	"coins" integer NOT NULL,
	"multiplier" real DEFAULT 1 NOT NULL,
	"validated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "missions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"icon" text NOT NULL,
	"category" text NOT NULL,
	"points" integer NOT NULL,
	"frequency" jsonb NOT NULL,
	"assignee" text DEFAULT 'both' NOT NULL,
	"requires_validation" boolean DEFAULT false NOT NULL,
	"kind" text DEFAULT 'check' NOT NULL,
	"target" integer,
	"is_challenge" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "step_logs" (
	"user_id" text NOT NULL,
	"date" text NOT NULL,
	"steps" integer NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"display_name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"session_version" integer DEFAULT 1 NOT NULL,
	"steps_token" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "completions" ADD CONSTRAINT "completions_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "completions" ADD CONSTRAINT "completions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "completions" ADD CONSTRAINT "completions_validated_by_users_id_fk" FOREIGN KEY ("validated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "step_logs" ADD CONSTRAINT "step_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "completions_unique_day" ON "completions" USING btree ("mission_id","user_id","date");--> statement-breakpoint
CREATE INDEX "completions_user_date" ON "completions" USING btree ("user_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "step_logs_user_date" ON "step_logs" USING btree ("user_id","date");