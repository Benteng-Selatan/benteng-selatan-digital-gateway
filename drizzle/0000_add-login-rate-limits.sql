-- Custom SQL migration file, put your code below! --
CREATE TABLE IF NOT EXISTS "login_rate_limits" (
  "key" text PRIMARY KEY NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "window_started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "blocked_until" timestamp with time zone,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "login_rate_limits_blocked_until_idx"
  ON "login_rate_limits" USING btree ("blocked_until");