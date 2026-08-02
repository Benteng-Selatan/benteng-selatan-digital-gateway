-- v0.5.0 secure population MVP
-- Reproducible baseline + incremental additions. Safe to re-run.

CREATE TABLE IF NOT EXISTS "cms_documents" (
  "id" text PRIMARY KEY NOT NULL,
  "data" jsonb NOT NULL,
  "version" integer DEFAULT 1 NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE "cms_documents" ADD COLUMN IF NOT EXISTS "version" integer DEFAULT 1 NOT NULL;
UPDATE "cms_documents" SET "version" = 1 WHERE "version" IS NULL OR "version" < 1;

CREATE TABLE IF NOT EXISTS "citizen_users" (
  "id" text PRIMARY KEY NOT NULL,
  "email" text NOT NULL,
  "password_hash" text NOT NULL,
  "full_name" text NOT NULL,
  "phone" text DEFAULT '' NOT NULL,
  "address" text DEFAULT '' NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "citizen_users_email_uidx" ON "citizen_users" ("email");

CREATE TABLE IF NOT EXISTS "service_requests" (
  "id" text PRIMARY KEY NOT NULL,
  "request_number" text NOT NULL,
  "citizen_id" text NOT NULL,
  "service_code" text NOT NULL,
  "status" text DEFAULT 'submitted' NOT NULL,
  "applicant_name" text NOT NULL,
  "identity_number_encrypted" text NOT NULL,
  "family_card_number_encrypted" text DEFAULT '' NOT NULL,
  "phone" text NOT NULL,
  "address" text NOT NULL,
  "form_data" jsonb NOT NULL,
  "citizen_note" text DEFAULT '' NOT NULL,
  "assigned_to" text DEFAULT '' NOT NULL,
  "staff_note" text DEFAULT '' NOT NULL,
  "submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "completed_at" timestamp with time zone
);
CREATE UNIQUE INDEX IF NOT EXISTS "service_requests_number_uidx" ON "service_requests" ("request_number");
CREATE INDEX IF NOT EXISTS "service_requests_citizen_idx" ON "service_requests" ("citizen_id");
CREATE INDEX IF NOT EXISTS "service_requests_status_idx" ON "service_requests" ("status");

CREATE TABLE IF NOT EXISTS "service_request_messages" (
  "id" text PRIMARY KEY NOT NULL,
  "request_id" text NOT NULL,
  "sender_type" text NOT NULL,
  "sender_label" text NOT NULL,
  "message" text NOT NULL,
  "is_internal" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "service_request_messages_request_idx" ON "service_request_messages" ("request_id");

CREATE TABLE IF NOT EXISTS "service_request_history" (
  "id" text PRIMARY KEY NOT NULL,
  "request_id" text NOT NULL,
  "previous_status" text NOT NULL,
  "new_status" text NOT NULL,
  "changed_by" text NOT NULL,
  "note" text DEFAULT '' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "service_request_history_request_idx" ON "service_request_history" ("request_id");

CREATE TABLE IF NOT EXISTS "content_submissions" (
  "id" text PRIMARY KEY NOT NULL,
  "submission_number" text NOT NULL,
  "citizen_id" text NOT NULL,
  "type" text NOT NULL,
  "status" text DEFAULT 'submitted' NOT NULL,
  "payload" jsonb NOT NULL,
  "review_note" text DEFAULT '' NOT NULL,
  "published_item_id" text DEFAULT '' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "published_at" timestamp with time zone
);
CREATE UNIQUE INDEX IF NOT EXISTS "content_submissions_number_uidx" ON "content_submissions" ("submission_number");
CREATE INDEX IF NOT EXISTS "content_submissions_citizen_idx" ON "content_submissions" ("citizen_id");
CREATE INDEX IF NOT EXISTS "content_submissions_status_idx" ON "content_submissions" ("status");

CREATE TABLE IF NOT EXISTS "login_rate_limits" (
  "key" text PRIMARY KEY NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "window_started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "blocked_until" timestamp with time zone,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "login_rate_limits_blocked_until_idx" ON "login_rate_limits" ("blocked_until");

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
CREATE UNIQUE INDEX IF NOT EXISTS "staff_users_username_uidx" ON "staff_users" ("username");
CREATE INDEX IF NOT EXISTS "staff_users_role_idx" ON "staff_users" ("role");
CREATE INDEX IF NOT EXISTS "staff_users_active_idx" ON "staff_users" ("is_active");

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
CREATE INDEX IF NOT EXISTS "audit_logs_actor_idx" ON "audit_logs" ("actor_id");
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs" ("action");
CREATE INDEX IF NOT EXISTS "audit_logs_entity_idx" ON "audit_logs" ("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs" ("created_at");

CREATE TABLE IF NOT EXISTS "action_rate_limits" (
  "key" text PRIMARY KEY NOT NULL,
  "scope" text NOT NULL,
  "actor_id" text DEFAULT 'anonymous' NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "window_started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "blocked_until" timestamp with time zone,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "action_rate_limits_scope_idx" ON "action_rate_limits" ("scope");
CREATE INDEX IF NOT EXISTS "action_rate_limits_blocked_until_idx" ON "action_rate_limits" ("blocked_until");

CREATE TABLE IF NOT EXISTS "idempotency_records" (
  "key" text PRIMARY KEY NOT NULL,
  "scope" text NOT NULL,
  "actor_id" text NOT NULL,
  "request_hash" text NOT NULL,
  "response_body" jsonb NOT NULL,
  "status_code" integer NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "idempotency_records_scope_actor_idx" ON "idempotency_records" ("scope", "actor_id");
CREATE INDEX IF NOT EXISTS "idempotency_records_expires_at_idx" ON "idempotency_records" ("expires_at");

CREATE TABLE IF NOT EXISTS "pending_uploads" (
  "id" text PRIMARY KEY NOT NULL,
  "citizen_id" text NOT NULL,
  "submission_id" text,
  "private_url" text NOT NULL,
  "pathname" text NOT NULL,
  "content_type" text NOT NULL,
  "size" integer NOT NULL,
  "width" integer NOT NULL,
  "height" integer NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "published_url" text DEFAULT '' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "pending_uploads_citizen_idx" ON "pending_uploads" ("citizen_id");
CREATE INDEX IF NOT EXISTS "pending_uploads_submission_idx" ON "pending_uploads" ("submission_id");
CREATE INDEX IF NOT EXISTS "pending_uploads_status_idx" ON "pending_uploads" ("status");

-- Foreign keys are added separately so existing installations also receive them.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_requests_citizen_id_fk') THEN
    ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_citizen_id_fk"
      FOREIGN KEY ("citizen_id") REFERENCES "citizen_users"("id") ON DELETE CASCADE NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_request_messages_request_id_fk') THEN
    ALTER TABLE "service_request_messages" ADD CONSTRAINT "service_request_messages_request_id_fk"
      FOREIGN KEY ("request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_request_history_request_id_fk') THEN
    ALTER TABLE "service_request_history" ADD CONSTRAINT "service_request_history_request_id_fk"
      FOREIGN KEY ("request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'content_submissions_citizen_id_fk') THEN
    ALTER TABLE "content_submissions" ADD CONSTRAINT "content_submissions_citizen_id_fk"
      FOREIGN KEY ("citizen_id") REFERENCES "citizen_users"("id") ON DELETE CASCADE NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pending_uploads_citizen_id_fk') THEN
    ALTER TABLE "pending_uploads" ADD CONSTRAINT "pending_uploads_citizen_id_fk"
      FOREIGN KEY ("citizen_id") REFERENCES "citizen_users"("id") ON DELETE CASCADE NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pending_uploads_submission_id_fk') THEN
    ALTER TABLE "pending_uploads" ADD CONSTRAINT "pending_uploads_submission_id_fk"
      FOREIGN KEY ("submission_id") REFERENCES "content_submissions"("id") ON DELETE SET NULL NOT VALID;
  END IF;
END $$;

-- NOT VALID preserves compatibility with legacy rows while enforcing valid values for new writes.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cms_documents_version_check') THEN
    ALTER TABLE "cms_documents" ADD CONSTRAINT "cms_documents_version_check" CHECK ("version" >= 1) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'staff_users_role_check') THEN
    ALTER TABLE "staff_users" ADD CONSTRAINT "staff_users_role_check" CHECK ("role" IN ('super_admin','operator','content_editor','reviewer','auditor')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_requests_status_check') THEN
    ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_status_check" CHECK ("status" IN ('submitted','under_review','revision_required','verified','approved','rejected','completed')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_request_messages_sender_check') THEN
    ALTER TABLE "service_request_messages" ADD CONSTRAINT "service_request_messages_sender_check" CHECK ("sender_type" IN ('citizen','staff','system')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'content_submissions_type_check') THEN
    ALTER TABLE "content_submissions" ADD CONSTRAINT "content_submissions_type_check" CHECK ("type" IN ('umkm','tourism','map')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'content_submissions_status_check') THEN
    ALTER TABLE "content_submissions" ADD CONSTRAINT "content_submissions_status_check" CHECK ("status" IN ('submitted','under_review','revision_required','approved','published','rejected')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pending_uploads_status_check') THEN
    ALTER TABLE "pending_uploads" ADD CONSTRAINT "pending_uploads_status_check" CHECK ("status" IN ('pending','linked','promoted','published','rejected','deleted')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pending_uploads_dimensions_check') THEN
    ALTER TABLE "pending_uploads" ADD CONSTRAINT "pending_uploads_dimensions_check" CHECK (
      "size" > 0 AND "size" <= 4194304 AND
      "width" > 0 AND "width" <= 7000 AND
      "height" > 0 AND "height" <= 7000 AND
      "width" * "height" <= 24000000
    ) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pending_uploads_content_type_check') THEN
    ALTER TABLE "pending_uploads" ADD CONSTRAINT "pending_uploads_content_type_check" CHECK ("content_type" IN ('image/jpeg','image/png','image/webp')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'idempotency_records_status_code_check') THEN
    ALTER TABLE "idempotency_records" ADD CONSTRAINT "idempotency_records_status_code_check" CHECK ("status_code" BETWEEN 0 AND 599) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'action_rate_limits_attempts_check') THEN
    ALTER TABLE "action_rate_limits" ADD CONSTRAINT "action_rate_limits_attempts_check" CHECK ("attempts" >= 0) NOT VALID;
  END IF;
END $$;
