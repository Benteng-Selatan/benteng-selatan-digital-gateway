import { eq } from "drizzle-orm";

import type { AdminSession } from "@/lib/auth";
import { auditValues, type AuditContext } from "@/lib/audit";

import { db, sql } from "@/lib/db";
import { cmsDocuments, contentSubmissions } from "@/lib/db/schema";
import { defaultSiteData as defaults, normalizeSiteData } from "@/lib/site-data-normalizer";
import { validateSocialDashboard } from "@/lib/social-dashboard";
import type { SiteData } from "@/lib/types";

export { normalizeSiteData } from "@/lib/site-data-normalizer";

const DOCUMENT_ID = "main";

export async function getSiteData(): Promise<SiteData> {
  const [document] = await db
    .select({ data: cmsDocuments.data })
    .from(cmsDocuments)
    .where(eq(cmsDocuments.id, DOCUMENT_ID))
    .limit(1);

  if (document) return normalizeSiteData(document.data);

  const initialData: SiteData = normalizeSiteData({
    ...defaults,
    updatedAt: new Date().toISOString(),
  });

  await db
    .insert(cmsDocuments)
    .values({ id: DOCUMENT_ID, data: initialData, updatedAt: new Date() })
    .onConflictDoNothing();

  return initialData;
}

export async function writeSiteData(input: SiteData): Promise<SiteData> {
  const now = new Date();
  const data = normalizeSiteData({ ...input, updatedAt: now.toISOString() });

  await db
    .insert(cmsDocuments)
    .values({ id: DOCUMENT_ID, data, updatedAt: now })
    .onConflictDoUpdate({
      target: cmsDocuments.id,
      set: { data, updatedAt: now },
    });

  return data;
}

export async function writeSiteDataWithAudit(
  input: SiteData,
  actor: AdminSession,
  context: AuditContext
): Promise<SiteData> {
  const now = new Date();
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
      updatedAt: data.updatedAt,
      automaticallyUnpublishedSubmissionIds: removedSubmissionIds,
      welfareDashboardStatus: data.socialDashboard.status,
    },
  });

  await sql.transaction([
    sql`INSERT INTO cms_documents (id, data, updated_at)
      VALUES (${DOCUMENT_ID}, ${JSON.stringify(data)}::jsonb, ${now})
      ON CONFLICT (id) DO UPDATE SET data=EXCLUDED.data, updated_at=EXCLUDED.updated_at`,
    sql`UPDATE content_submissions
      SET status='approved', published_at=NULL, updated_at=${now},
          review_note=CASE WHEN review_note='' THEN 'Konten ditarik melalui CMS.' ELSE review_note END
      WHERE id IN (
        SELECT jsonb_array_elements_text(${JSON.stringify(removedSubmissionIds)}::jsonb)
      )`,
    sql`INSERT INTO audit_logs (id, actor_id, actor_username, actor_name, actor_role, action, entity_type, entity_id, metadata, ip_address, user_agent, created_at)
      VALUES (${audit.id}, ${audit.actorId}, ${audit.actorUsername}, ${audit.actorName}, ${audit.actorRole}, ${audit.action}, ${audit.entityType}, ${audit.entityId}, ${JSON.stringify(audit.metadata)}::jsonb, ${audit.ipAddress}, ${audit.userAgent}, ${audit.createdAt})`,
  ]);
  return data;
}

export function validateSiteData(value: unknown): value is SiteData {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<SiteData>;
  if (!(
    data.site &&
    data.profile &&
    data.contact &&
    Array.isArray(data.services) &&
    Array.isArray(data.socialStatistics) &&
    data.socialDashboard &&
    data.socialContent &&
    Array.isArray(data.umkm) &&
    Array.isArray(data.mapLocations) &&
    Array.isArray(data.stories)
  )) return false;

  return data.socialDashboard.status === "draft" || validateSocialDashboard(data.socialDashboard).length === 0;
}
