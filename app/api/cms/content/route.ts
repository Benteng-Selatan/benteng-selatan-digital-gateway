import { revalidatePath } from "next/cache";

import { publicAdminSession, requireAdminPermission } from "@/lib/auth";
import { auditContextFromRequest } from "@/lib/audit";
import {
  CmsConflictError,
  getSiteDocument,
  normalizeSiteData,
  siteDataErrors,
  writeSiteDataWithAudit,
} from "@/lib/cms";
import type { SiteData } from "@/lib/types";

export async function GET() {
  const session = await requireAdminPermission("cms:view");
  if (!session) return Response.json({ message: "Akses ditolak." }, { status: 403 });
  const document = await getSiteDocument();
  return Response.json({ ...document, user: publicAdminSession(session) }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  const session = await requireAdminPermission("cms:edit");
  if (!session) return Response.json({ message: "Akses ditolak." }, { status: 403 });

  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > 2 * 1024 * 1024) {
    return Response.json({ message: "Payload CMS terlalu besar." }, { status: 413 });
  }

  const payload = await request.json().catch(() => null) as { data?: unknown; expectedVersion?: unknown } | null;
  const input = payload?.data;
  const expectedVersion = Number(payload?.expectedVersion);
  const normalizedInput = input && typeof input === "object"
    ? normalizeSiteData(input as SiteData)
    : input;
  const errors = siteDataErrors(normalizedInput);
  if (errors.length) {
    return Response.json({ message: "Data CMS tidak valid.", errors }, { status: 400 });
  }

  try {
    const document = await writeSiteDataWithAudit(
      normalizedInput as SiteData,
      expectedVersion,
      session,
      auditContextFromRequest(request)
    );
    revalidatePath("/", "layout");
    return Response.json(document, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof CmsConflictError) {
      return Response.json({ message: error.message }, { status: 409 });
    }
    throw error;
  }
}
