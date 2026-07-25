ALTER TABLE "service_requests"
  ADD COLUMN IF NOT EXISTS "public_note" text DEFAULT '' NOT NULL;

ALTER TABLE "service_request_history"
  ADD COLUMN IF NOT EXISTS "public_note" text DEFAULT '' NOT NULL;

CREATE TABLE IF NOT EXISTS "rate_limit_buckets" (
  "key" text PRIMARY KEY NOT NULL,
  "count" integer DEFAULT 0 NOT NULL,
  "window_started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone NOT NULL
);

CREATE INDEX IF NOT EXISTS "rate_limit_buckets_expires_idx"
  ON "rate_limit_buckets" USING btree ("expires_at");
