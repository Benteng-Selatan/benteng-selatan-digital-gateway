import { eq } from "drizzle-orm";

import seedData from "@/data/site-data.seed.json";
import { db, sqlClient } from "@/lib/db";
import { cmsDocuments } from "@/lib/db/schema";
import type { SiteData } from "@/lib/types";

const DOCUMENT_ID = "main";

export class CmsConflictError extends Error {
  constructor() {
    super("Konten telah berubah sejak halaman dibuka. Muat ulang data sebelum menyimpan kembali.");
    this.name = "CmsConflictError";
  }
}

export interface SiteDocument {
  data: SiteData;
  revision: string;
}

function normalizeDocument(data: SiteData, revision: Date | string): SiteDocument {
  const revisionDate = revision instanceof Date ? revision : new Date(revision);
  const normalizedRevision = revisionDate.toISOString();
  return {
    data: {
      ...data,
      updatedAt: normalizedRevision,
    },
    revision: normalizedRevision,
  };
}

export async function getSiteDocument(): Promise<SiteDocument> {
  const [document] = await db
    .select({
      data: cmsDocuments.data,
      updatedAt: cmsDocuments.updatedAt,
    })
    .from(cmsDocuments)
    .where(eq(cmsDocuments.id, DOCUMENT_ID))
    .limit(1);

  if (document) {
    return normalizeDocument(document.data, document.updatedAt);
  }

  const now = new Date();
  const initialData: SiteData = {
    ...(seedData as SiteData),
    updatedAt: now.toISOString(),
  };

  await db
    .insert(cmsDocuments)
    .values({
      id: DOCUMENT_ID,
      data: initialData,
      updatedAt: now,
    })
    .onConflictDoNothing();

  const [created] = await db
    .select({
      data: cmsDocuments.data,
      updatedAt: cmsDocuments.updatedAt,
    })
    .from(cmsDocuments)
    .where(eq(cmsDocuments.id, DOCUMENT_ID))
    .limit(1);

  if (!created) {
    throw new Error("Dokumen CMS gagal diinisialisasi.");
  }

  return normalizeDocument(created.data, created.updatedAt);
}

export async function getSiteData(): Promise<SiteData> {
  return (await getSiteDocument()).data;
}

export async function writeSiteData(input: SiteData): Promise<SiteData> {
  const expectedRevision = new Date(input.updatedAt);
  if (Number.isNaN(expectedRevision.getTime())) {
    throw new Error("Versi dokumen CMS tidak valid. Muat ulang halaman sebelum menyimpan.");
  }

  const now = new Date();
  const data: SiteData = {
    ...input,
    updatedAt: now.toISOString(),
  };

  const rows = await sqlClient`
    UPDATE cms_documents
    SET data = ${JSON.stringify(data)}::jsonb,
        updated_at = ${now.toISOString()}::timestamptz
    WHERE id = ${DOCUMENT_ID}
      AND updated_at = ${expectedRevision.toISOString()}::timestamptz
    RETURNING updated_at
  `;

  if (rows.length !== 1) {
    throw new CmsConflictError();
  }

  return data;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isString(value: unknown, max = 10_000): value is string {
  return typeof value === "string" && value.length <= max;
}

function isStringArray(value: unknown, maxItems = 200, maxLength = 2_000): value is string[] {
  return Array.isArray(value) && value.length <= maxItems && value.every((item) => isString(item, maxLength));
}

function isPublishStatus(value: unknown): value is "published" | "draft" {
  return value === "published" || value === "draft";
}

function hasUniqueStrings(values: string[]): boolean {
  return new Set(values).size === values.length;
}

function validSite(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return [
    "name", "kelurahan", "tagline", "description", "heroImage",
    "primaryCtaLabel", "primaryCtaHref", "secondaryCtaLabel", "secondaryCtaHref",
  ].every((key) => isString(value[key], 2_000));
}

function validProfile(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return ["heading", "description", "communityOverview", "leaderName", "governmentDescription", "image"]
    .every((key) => isString(value[key], 5_000)) &&
    isStringArray(value.potentials) &&
    isStringArray(value.facilities);
}

function validContact(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return ["address", "serviceHours", "phone", "email", "whatsapp", "instagram", "facebook", "mapsUrl"]
    .every((key) => isString(value[key], 2_000));
}

function validService(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return ["id", "slug", "name", "shortDescription", "serviceHours", "location", "contact", "note"]
    .every((key) => isString(value[key], 5_000)) &&
    isStringArray(value.requirements) &&
    isStringArray(value.steps) &&
    isPublishStatus(value.status);
}

function validSocialStatistic(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return ["id", "category", "description", "year", "source"].every((key) => isString(value[key], 2_000)) &&
    typeof value.value === "number" && Number.isFinite(value.value) &&
    isPublishStatus(value.status);
}

function validSocialContent(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isString(value.intro, 10_000) &&
    isStringArray(value.accessBarriers) &&
    isStringArray(value.recommendations) &&
    isStringArray(value.serviceFlow) &&
    isString(value.referralContact, 2_000) &&
    isString(value.privacyNote, 5_000);
}

function validUmkm(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return [
    "id", "slug", "name", "category", "featuredProduct", "description", "image",
    "publicContact", "generalLocation", "instagram", "marketplace",
  ].every((key) => isString(value[key], 5_000)) &&
    typeof value.contactApproved === "boolean" &&
    isPublishStatus(value.status);
}

function validMapLocation(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const latitude = value.latitude;
  const longitude = value.longitude;
  const validLatitude = latitude === null || (typeof latitude === "number" && Number.isFinite(latitude) && latitude >= -90 && latitude <= 90);
  const validLongitude = longitude === null || (typeof longitude === "number" && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180);
  return ["id", "name", "category", "description", "generalLocation", "mapsUrl"]
    .every((key) => isString(value[key], 5_000)) &&
    validLatitude && validLongitude && isPublishStatus(value.status);
}

function validStory(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return ["id", "slug", "title", "category", "excerpt", "content", "image", "generalLocation", "source"]
    .every((key) => isString(value[key], 15_000)) &&
    isPublishStatus(value.status);
}

export function validateSiteData(value: unknown): value is SiteData {
  if (!isRecord(value)) return false;
  if (!validSite(value.site) || !validProfile(value.profile) || !validContact(value.contact) || !validSocialContent(value.socialContent)) {
    return false;
  }
  if (!Array.isArray(value.services) || !value.services.every(validService)) return false;
  if (!Array.isArray(value.socialStatistics) || !value.socialStatistics.every(validSocialStatistic)) return false;
  if (!Array.isArray(value.umkm) || !value.umkm.every(validUmkm)) return false;
  if (!Array.isArray(value.mapLocations) || !value.mapLocations.every(validMapLocation)) return false;
  if (!Array.isArray(value.stories) || !value.stories.every(validStory)) return false;
  if (!isString(value.updatedAt, 100) || Number.isNaN(new Date(value.updatedAt).getTime())) return false;

  const allIds = [
    ...value.services.map((item) => item.id),
    ...value.socialStatistics.map((item) => item.id),
    ...value.umkm.map((item) => item.id),
    ...value.mapLocations.map((item) => item.id),
    ...value.stories.map((item) => item.id),
  ];
  if (!allIds.every(Boolean) || !hasUniqueStrings(allIds)) return false;
  if (!hasUniqueStrings(value.services.map((item) => item.slug)) ||
      !hasUniqueStrings(value.umkm.map((item) => item.slug)) ||
      !hasUniqueStrings(value.stories.map((item) => item.slug))) return false;

  return true;
}
