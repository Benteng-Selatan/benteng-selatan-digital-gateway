import { eq } from "drizzle-orm";

import type { AdminSession } from "@/lib/auth";
import { auditValues, type AuditContext } from "@/lib/audit";
import { db, sql } from "@/lib/db";
import { cmsDocuments, contentSubmissions } from "@/lib/db/schema";
import { defaultSiteData as defaults, normalizeSiteData } from "@/lib/site-data-normalizer";
import { siteDataValidationErrors, validateSiteDataInput } from "@/lib/site-data-validation";
import type { SiteData } from "@/lib/types";

export { normalizeSiteData } from "@/lib/site-data-normalizer";

const DOCUMENT_ID = "main";

export interface SiteDocument {
  data: SiteData;
  version: number;
  updatedAt: string;
}

export class CmsConflictError extends Error {
  constructor() {
    super("Konten telah diperbarui oleh petugas lain. Muat ulang halaman sebelum menyimpan kembali.");
    this.name = "CmsConflictError";
  }
}

export async function getSiteDocument(): Promise<SiteDocument> {
  const [document] = await db
    .select({ data: cmsDocuments.data, version: cmsDocuments.version, updatedAt: cmsDocuments.updatedAt })
    .from(cmsDocuments)
    .where(eq(cmsDocuments.id, DOCUMENT_ID))
    .limit(1);

  if (document) {
    return {
      data: normalizeSiteData(document.data),
      version: document.version,
      updatedAt: document.updatedAt.toISOString(),
    };
  }

  const now = new Date();
  const initialData: SiteData = normalizeSiteData({
    ...defaults,
    updatedAt: now.toISOString(),
  });

  await db
    .insert(cmsDocuments)
    .values({ id: DOCUMENT_ID, data: initialData, version: 1, updatedAt: now })
    .onConflictDoNothing();

  const [created] = await db
    .select({ data: cmsDocuments.data, version: cmsDocuments.version, updatedAt: cmsDocuments.updatedAt })
    .from(cmsDocuments)
    .where(eq(cmsDocuments.id, DOCUMENT_ID))
    .limit(1);

  return {
    data: normalizeSiteData(created?.data || initialData),
    version: created?.version || 1,
    updatedAt: (created?.updatedAt || now).toISOString(),
  };
}

export async function getSiteData(): Promise<SiteData> {
  return (await getSiteDocument()).data;
}

function changedSections(previous: SiteData, next: SiteData): string[] {
  const sections: (keyof SiteData)[] = [
    "site", "profile", "contact", "services", "socialStatistics", "socialDashboard",
    "populationDashboard", "socialContent", "umkm", "mapLocations", "stories",
  ];
  return sections.filter((key) => JSON.stringify(previous[key]) !== JSON.stringify(next[key]));
}

export async function writeSiteDataWithAudit(
  input: SiteData,
  expectedVersion: number,
  actor: AdminSession,
  context: AuditContext
): Promise<SiteDocument> {
  if (!Number.isInteger(expectedVersion) || expectedVersion < 1) throw new CmsConflictError();

  const current = await getSiteDocument();
  if (current.version !== expectedVersion) throw new CmsConflictError();

  const now = new Date();
  const nextVersion = expectedVersion + 1;
  const data = normalizeSiteData({ ...input, updatedAt: now.toISOString() });
  const presentIds = new Set([
    ...data.umkm.map((item) => item.id),
    ...data.stories.map((item) => item.id),
    ...data.mapLocations.map((item) => item.id),
  ]);
  const published = await db
    .select({ id: contentSubmissions.id, publishedItemId: contentSubmissions.publishedItemId })
    .from(contentSubmissions)
    .where(eq(contentSubmissions.status, "published"));
  const removedSubmissionIds = published
    .filter((item) => item.publishedItemId && !presentIds.has(item.publishedItemId))
    .map((item) => item.id);

  const audit = auditValues({
    actor,
    context,
    action: "cms.update",
    entityType: "cms_document",
    entityId: DOCUMENT_ID,
    metadata: {
      previousVersion: expectedVersion,
      version: nextVersion,
      updatedAt: data.updatedAt,
      changedSections: changedSections(current.data, data),
      automaticallyUnpublishedSubmissionIds: removedSubmissionIds,
      welfareDashboardStatus: data.socialDashboard.status,
      populationDashboardStatus: data.populationDashboard.status,
    },
  });

  const results = await sql.transaction([
    sql`UPDATE cms_documents
      SET data=${JSON.stringify(data)}::jsonb, version=${nextVersion}, updated_at=${now}
      WHERE id=${DOCUMENT_ID} AND version=${expectedVersion}
      RETURNING version`,
    sql`UPDATE content_submissions
      SET status='approved', published_at=NULL, updated_at=${now},
          review_note=CASE WHEN review_note='' THEN 'Konten ditarik melalui CMS.' ELSE review_note END
      WHERE id IN (SELECT jsonb_array_elements_text(${JSON.stringify(removedSubmissionIds)}::jsonb))
        AND EXISTS (
          SELECT 1 FROM cms_documents
          WHERE id=${DOCUMENT_ID} AND version=${nextVersion} AND updated_at=${now}
        )`,
    sql`INSERT INTO audit_logs (id, actor_id, actor_username, actor_name, actor_role, action, entity_type, entity_id, metadata, ip_address, user_agent, created_at)
      SELECT ${audit.id}, ${audit.actorId}, ${audit.actorUsername}, ${audit.actorName}, ${audit.actorRole}, ${audit.action}, ${audit.entityType}, ${audit.entityId}, ${JSON.stringify(audit.metadata)}::jsonb, ${audit.ipAddress}, ${audit.userAgent}, ${audit.createdAt}
      WHERE EXISTS (
        SELECT 1 FROM cms_documents
        WHERE id=${DOCUMENT_ID} AND version=${nextVersion} AND updated_at=${now}
      )`,
  ]);

  const updateRows = results[0] as unknown as Array<{ version: number }>;
  if (!Array.isArray(updateRows) || updateRows.length === 0) throw new CmsConflictError();
  return { data, version: nextVersion, updatedAt: data.updatedAt };
}

export function validateSiteData(value: unknown): value is SiteData {
  return validateSiteDataInput(value);
}

export function siteDataErrors(value: unknown): string[] {
  return siteDataValidationErrors(value);
}
