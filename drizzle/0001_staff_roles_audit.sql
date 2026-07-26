CREATE TABLE IF NOT EXISTS "staff_users" (
  "id" text PRIMARY KEY NOT NULL,
  "username" text NOT NULL,
  "password_hash" text NOT NULL,
  "full_name" text NOT NULL,
  "role" text DEFAULT 'operator' NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "session_version" integer DEFAULT 1 NOT NULL,
  "last_login_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "staff_users_username_uidx" ON "staff_users" USING btree ("username");
CREATE INDEX IF NOT EXISTS "staff_users_role_idx" ON "staff_users" USING btree ("role");
CREATE INDEX IF NOT EXISTS "staff_users_active_idx" ON "staff_users" USING btree ("is_active");

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" text PRIMARY KEY NOT NULL,
  "actor_id" text,
  "actor_username" text DEFAULT 'system' NOT NULL,
  "actor_name" text DEFAULT 'System' NOT NULL,
  "actor_role" text DEFAULT 'system' NOT NULL,
  "action" text NOT NULL,
  "entity_type" text NOT NULL,
  "entity_id" text DEFAULT '' NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "ip_address" text DEFAULT 'unknown' NOT NULL,
  "user_agent" text DEFAULT '' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_id");
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs" USING btree ("action");
CREATE INDEX IF NOT EXISTS "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");
