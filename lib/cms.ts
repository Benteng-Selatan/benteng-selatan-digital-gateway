import { eq } from "drizzle-orm";

import seedData from "@/data/site-data.seed.json";
import { db } from "@/lib/db";
import { cmsDocuments } from "@/lib/db/schema";
import type { SiteData } from "@/lib/types";

const DOCUMENT_ID = "main";

export async function getSiteData(): Promise<SiteData> {
  const [document] = await db
    .select({
      data: cmsDocuments.data,
    })
    .from(cmsDocuments)
    .where(eq(cmsDocuments.id, DOCUMENT_ID))
    .limit(1);

  if (document) {
    return document.data;
  }

  const initialData: SiteData = {
    ...(seedData as SiteData),
    updatedAt: new Date().toISOString(),
  };

  await db
    .insert(cmsDocuments)
    .values({
      id: DOCUMENT_ID,
      data: initialData,
      updatedAt: new Date(),
    })
    .onConflictDoNothing();

  return initialData;
}

export async function writeSiteData(
  input: SiteData
): Promise<SiteData> {
  const now = new Date();

  const data: SiteData = {
    ...input,
    updatedAt: now.toISOString(),
  };

  await db
    .insert(cmsDocuments)
    .values({
      id: DOCUMENT_ID,
      data,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: cmsDocuments.id,
      set: {
        data,
        updatedAt: now,
      },
    });

  return data;
}

export function validateSiteData(
  value: unknown
): value is SiteData {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Partial<SiteData>;

  return Boolean(
    data.site &&
      data.profile &&
      data.contact &&
      Array.isArray(data.services) &&
      Array.isArray(data.socialStatistics) &&
      data.socialContent &&
      Array.isArray(data.umkm) &&
      Array.isArray(data.mapLocations) &&
      Array.isArray(data.stories)
  );
}