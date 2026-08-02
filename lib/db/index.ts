import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "@/lib/db/schema";
import { assertDatabaseEnvironment } from "@/lib/db/environment";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL belum tersedia. Periksa file .env.local.");
}

assertDatabaseEnvironment(databaseUrl);

export const sql = neon(databaseUrl);

export const db = drizzle(sql, {
  schema,
});
