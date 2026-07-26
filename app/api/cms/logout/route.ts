import { cookies } from "next/headers";

import { getAdminSession, SESSION_COOKIE } from "@/lib/auth";
import { auditContextFromRequest, recordAudit } from "@/lib/audit";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (session) {
    await recordAudit({
      actor: session,
      action: "auth.logout",
      entityType: "staff_session",
      entityId: session.userId,
      context: auditContextFromRequest(request),
    });
  }
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  return Response.json({ ok: true });
}
