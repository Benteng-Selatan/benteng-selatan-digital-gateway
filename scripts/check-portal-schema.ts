import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const databaseUrl =
    process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL_UNPOOLED atau DATABASE_URL belum tersedia.",
    );
  }

  const sql = neon(databaseUrl);

  const requiredTables = [
    "cms_documents",
    "citizen_users",
    "service_requests",
    "service_request_messages",
    "service_request_history",
    "content_submissions",
    "rate_limit_buckets",
  ];

  const rows = await sql`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
  `;

  const available = new Set(
    rows.map((row) => String(row.table_name)),
  );

  const missing = requiredTables.filter(
    (table) => !available.has(table),
  );

  const columnRows = await sql`
    select table_name, column_name
    from information_schema.columns
    where table_schema = 'public'
  `;
  const columns = new Set(
    columnRows.map((row) => `${String(row.table_name)}.${String(row.column_name)}`),
  );
  const requiredColumns = [
    "service_requests.public_note",
    "service_requests.staff_note",
    "service_request_history.public_note",
    "service_request_history.note",
    "rate_limit_buckets.key",
    "rate_limit_buckets.count",
    "rate_limit_buckets.window_started_at",
    "rate_limit_buckets.expires_at",
  ];
  const missingColumns = requiredColumns.filter((column) => !columns.has(column));

  if (missing.length > 0 || missingColumns.length > 0) {
    if (missing.length > 0) {
      console.error(`Schema belum lengkap. Tabel yang belum ada: ${missing.join(", ")}`);
    }
    if (missingColumns.length > 0) {
      console.error(`Schema belum lengkap. Kolom yang belum ada: ${missingColumns.join(", ")}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("Portal schema: OK");

  for (const table of requiredTables) {
    console.log(`- ${table}`);
  }
  for (const column of requiredColumns) {
    console.log(`- ${column}`);
  }
}

main().catch((error) => {
  console.error("Pemeriksaan schema gagal:");
  console.error(error);
  process.exitCode = 1;
});
