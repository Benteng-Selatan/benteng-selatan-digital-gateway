import { revalidatePath } from "next/cache";

import { publicAdminSession, requireAdminPermission } from "@/lib/auth";
import { auditContextFromRequest } from "@/lib/audit";
import { getSiteData, validateSiteData, writeSiteDataWithAudit } from "@/lib/cms";

export async function GET() {
  const session = await requireAdminPermission("cms:view");
  if (!session) return Response.json({ message: "Akses ditolak." }, { status: 403 });
  return Response.json({ data: await getSiteData(), user: publicAdminSession(session) });
}

export async function PUT(request: Request) {
  const session = await requireAdminPermission("cms:edit");
  if (!session) return Response.json({ message: "Akses ditolak." }, { status: 403 });
  const payload = await request.json().catch(() => null);
  if (!validateSiteData(payload)) return Response.json({ message: "Struktur data CMS tidak valid." }, { status: 400 });
  const data = await writeSiteDataWithAudit(
    payload,
    session,
    auditContextFromRequest(request)
  );
  revalidatePath("/", "layout");
  return Response.json({ data });
}
