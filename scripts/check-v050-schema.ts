import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

function checkedUrl(): string {
  const value = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!value) throw new Error("DATABASE_URL belum tersedia.");
  const url = new URL(value);
  const target = (process.env.DATABASE_TARGET_ENV || "").toLowerCase();
  const appEnv = (process.env.VERCEL_ENV || process.env.APP_ENV || "development").toLowerCase();
  const hosts = (process.env.DATABASE_ALLOWED_HOSTS || "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  if (!target || target !== appEnv) throw new Error("APP_ENV/VERCEL_ENV dan DATABASE_TARGET_ENV harus sama.");
  if (!hosts.includes(url.hostname.toLowerCase())) throw new Error("Hostname database tidak diizinkan oleh DATABASE_ALLOWED_HOSTS.");
  console.log(`Memeriksa environment ${target} pada hostname ${url.hostname}`);
  return value;
}

async function main() {
  const sql = neon(checkedUrl());
  const requiredTables = [
    "cms_documents", "citizen_users", "service_requests", "service_request_messages",
    "service_request_history", "content_submissions", "login_rate_limits", "staff_users",
    "audit_logs", "action_rate_limits", "idempotency_records", "pending_uploads",
  ];
  const tables = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public' AND table_name = ANY(${requiredTables})
  `;
  const available = new Set(tables.map((row) => String(row.table_name)));
  const missingTables = requiredTables.filter((name) => !available.has(name));
  if (missingTables.length) throw new Error(`Tabel belum tersedia: ${missingTables.join(", ")}`);

  const columns = await sql`
    SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema='public' AND (
      (table_name='cms_documents' AND column_name='version') OR
      (table_name='pending_uploads' AND column_name IN ('private_url','published_url','status','width','height'))
    )
  `;
  const columnKeys = new Set(columns.map((row) => `${row.table_name}.${row.column_name}`));
  const requiredColumns = [
    "cms_documents.version", "pending_uploads.private_url", "pending_uploads.published_url",
    "pending_uploads.status", "pending_uploads.width", "pending_uploads.height",
  ];
  const missingColumns = requiredColumns.filter((name) => !columnKeys.has(name));
  if (missingColumns.length) throw new Error(`Kolom belum tersedia: ${missingColumns.join(", ")}`);

  const indexes = await sql`
    SELECT indexname FROM pg_indexes WHERE schemaname='public'
      AND indexname IN ('action_rate_limits_scope_idx','idempotency_records_expires_at_idx','pending_uploads_status_idx')
  `;
  if (indexes.length !== 3) throw new Error("Index keamanan v0.5.0 belum lengkap.");

  console.log("Schema v0.5.0: OK");
  requiredTables.forEach((name) => console.log(`- ${name}`));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
