import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL_UNPOOLED) {
  throw new Error(
    "DATABASE_URL_UNPOOLED belum tersedia di .env.local."
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED,
  },
  verbose: true,
  strict: true,
});