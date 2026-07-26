import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL belum tersedia.");
  const sql = neon(url);
  const required = ["login_rate_limits", "staff_users", "audit_logs"];
  const rows = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = ANY(${required})
  `;
  const available = new Set(rows.map((row) => String(row.table_name)));
  const missing = required.filter((name) => !available.has(name));
  if (missing.length) throw new Error(`Tabel belum tersedia: ${missing.join(", ")}`);
  console.log("High-priority schema: OK");
  required.forEach((name) => console.log(`- ${name}`));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
