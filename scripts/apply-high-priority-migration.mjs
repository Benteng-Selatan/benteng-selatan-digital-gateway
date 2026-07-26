import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { config } from "dotenv";

config({ path: ".env.local" });

const connectionString =
  process.env.MIGRATION_DATABASE_URL ||
  process.env.DATABASE_URL_UNPOOLED;

if (!connectionString) {
  throw new Error(
    "MIGRATION_DATABASE_URL atau DATABASE_URL_UNPOOLED wajib tersedia."
  );
}

const url = new URL(connectionString);
const productionHostPrefix = "ep-noisy-bar-az142m1k";
const targetsKnownProduction = url.hostname.startsWith(productionHostPrefix);

if (
  targetsKnownProduction &&
  process.env.ALLOW_PRODUCTION_MIGRATION !== "YES"
) {
  throw new Error(
    "Target terdeteksi sebagai Production. Buat backup, uji migrasi pada branch sementara, lalu set ALLOW_PRODUCTION_MIGRATION=YES hanya untuk eksekusi terkontrol."
  );
}

const files = [
  resolve("drizzle/0000_add-login-rate-limits.sql"),
  resolve("drizzle/0001_staff_roles_audit.sql"),
];

console.log(`Target database: ${url.hostname}/${url.pathname.slice(1)}`);

for (const file of files) {
  console.log(`Menerapkan: ${file}`);
  const result = spawnSync(
    "psql",
    [
      "--host", url.hostname,
      "--port", url.port || "5432",
      "--username", decodeURIComponent(url.username),
      "--dbname", decodeURIComponent(url.pathname.slice(1)),
      "--set", "ON_ERROR_STOP=1",
      "--file", file,
    ],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        PGPASSWORD: decodeURIComponent(url.password),
        PGSSLMODE: "require",
      },
    }
  );
  if (result.status !== 0) {
    throw new Error(`Migrasi gagal pada ${file} dengan kode ${result.status}.`);
  }
}

console.log("Migrasi prioritas tinggi selesai.");
