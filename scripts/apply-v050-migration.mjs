import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { config } from "dotenv";

config({ path: ".env.local" });

const connectionString = process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;
if (!connectionString) throw new Error("MIGRATION_DATABASE_URL atau DATABASE_URL_UNPOOLED wajib tersedia.");

const url = new URL(connectionString);
const target = (process.env.DATABASE_TARGET_ENV || "").toLowerCase();
const appEnv = (process.env.VERCEL_ENV || process.env.APP_ENV || "development").toLowerCase();
const allowedHosts = (process.env.DATABASE_ALLOWED_HOSTS || "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);

if (!["development", "preview", "production"].includes(target)) {
  throw new Error("DATABASE_TARGET_ENV wajib development, preview, atau production.");
}
if (target !== appEnv) throw new Error(`Environment aplikasi (${appEnv}) tidak sama dengan target database (${target}).`);
if (!allowedHosts.includes(url.hostname.toLowerCase())) {
  throw new Error("Hostname database tidak terdapat dalam DATABASE_ALLOWED_HOSTS. Migrasi dihentikan.");
}
if (!process.env.VERCEL && target === "production") {
  throw new Error("Migrasi Production tidak boleh dijalankan dari komputer lokal.");
}
if (target === "production" && process.env.ALLOW_PRODUCTION_MIGRATION !== "YES_I_HAVE_A_VALID_BACKUP") {
  throw new Error("Production memerlukan backup valid dan ALLOW_PRODUCTION_MIGRATION=YES_I_HAVE_A_VALID_BACKUP.");
}

const file = resolve("drizzle/0002_secure_population_mvp.sql");
console.log(`Target environment: ${target}`);
console.log(`Target hostname: ${url.hostname}`);
console.log(`Migration: ${file}`);

const result = spawnSync(
  "psql",
  [
    "--host", url.hostname,
    "--port", url.port || "5432",
    "--username", decodeURIComponent(url.username),
    "--dbname", decodeURIComponent(url.pathname.slice(1)),
    "--set", "ON_ERROR_STOP=1",
    "--single-transaction",
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

if (result.error) throw result.error;
if (result.status !== 0) throw new Error(`Migrasi gagal dengan kode ${result.status}.`);
console.log("Migrasi v0.5.0 selesai. Jalankan npm run db:check-v050.");
