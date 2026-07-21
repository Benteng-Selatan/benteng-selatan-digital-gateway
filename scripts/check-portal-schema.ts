import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL_UNPOOLED atau DATABASE_URL belum tersedia.");

const sql = neon(databaseUrl);
const requiredTables = [
  "cms_documents",
  "citizen_users",
  "service_requests",
  "service_request_messages",
  "service_request_history",
  "content_submissions",
];

const rows = await sql`
  select table_name
  from information_schema.tables
  where table_schema = 'public'
`;
const available = new Set(rows.map((row) => String(row.table_name)));
const missing = requiredTables.filter((table) => !available.has(table));

if (missing.length) {
  console.error(`Schema belum lengkap. Tabel yang belum ada: ${missing.join(", ")}`);
  process.exitCode = 1;
} else {
  console.log("Portal schema: OK");
  for (const table of requiredTables) console.log(`- ${table}`);
}
