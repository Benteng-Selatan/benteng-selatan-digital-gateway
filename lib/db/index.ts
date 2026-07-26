import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "@/lib/db/schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL belum tersedia. Periksa file .env.local."
  );
}

const databaseHost = new URL(databaseUrl).hostname;
const productionDatabaseHost =
  "ep-noisy-bar-az142m1k-pooler.c-3.ap-southeast-1.aws.neon.tech";

const isLocalEnvironment = !process.env.VERCEL;

if (
  isLocalEnvironment &&
  databaseHost === productionDatabaseHost
) {
  throw new Error(
    "Koneksi database production diblokir pada lingkungan lokal. Gunakan database development."
  );
}

export const sql = neon(databaseUrl);

export const db = drizzle(sql, {
  schema,
});