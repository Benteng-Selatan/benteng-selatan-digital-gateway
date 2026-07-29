import { config } from "dotenv";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { normalizeSiteData } from "../lib/site-data-normalizer";
import type { SiteData } from "../lib/types";

config({ path: ".env.local" });

async function migrate(): Promise<void> {
  const [{ db }, { cmsDocuments }] = await Promise.all([
    import("../lib/db"),
    import("../lib/db/schema"),
  ]);

  const jsonPath = resolve(
    process.cwd(),
    "data/site-data.json"
  );

  const raw = await readFile(jsonPath, "utf8");
  const source = JSON.parse(raw) as SiteData;

  const data: SiteData = normalizeSiteData({
    ...source,
    updatedAt: new Date().toISOString(),
  });

  await db
    .insert(cmsDocuments)
    .values({
      id: "main",
      data,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: cmsDocuments.id,
      set: {
        data,
        updatedAt: new Date(),
      },
    });

  console.log("Data JSON berhasil dipindahkan ke PostgreSQL.");
  console.log(`Nama website: ${data.site.name}`);
  console.log(`Jumlah layanan: ${data.services.length}`);
  console.log(`Jumlah UMKM: ${data.umkm.length}`);
  console.log(`Jumlah lokasi: ${data.mapLocations.length}`);
}

migrate().catch((error: unknown) => {
  console.error("Migrasi gagal:");

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  process.exit(1);
});