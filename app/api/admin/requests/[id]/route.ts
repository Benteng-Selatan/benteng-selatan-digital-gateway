import {
  consumeActionRateLimit,
  getIdempotentResponse,
  hashRequestPayload,
  IdempotencyConflictError,
  rateLimitResponse,
  saveIdempotentResponse,
} from "@/lib/action-guard";
import { hasAdminPermission } from "@/lib/admin-permissions";
import { requireAdminPermission } from "@/lib/auth";
import { auditContextFromRequest, recordAudit } from "@/lib/audit";
import { getStaffRequest, updateStaffRequest } from "@/lib/portal";

const SCOPE = "admin.request.update";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminPermission("requests:view");
  if (!session) return Response.json({ message: "Akses ditolak." }, { status: 403 });
  const { id } = await params;
  const canViewSensitive = hasAdminPermission(session.role, "requests:sensitive");
  const item = await getStaffRequest(id, session.role, canViewSensitive);
  if (!item) return Response.json({ message: "Pengajuan tidak ditemukan." }, { status: 404 });
  await recordAudit({
    actor: session,
    action: canViewSensitive ? "request.view_sensitive" : "request.view",
    entityType: "service_request",
    entityId: id,
    context: auditContextFromRequest(request),
  });
  return Response.json(
    { request: item, canViewSensitive },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminPermission("requests:edit");
  if (!session) return Response.json({ message: "Akses ditolak." }, { status: 403 });
  const { id } = await params;
  const rateLimit = await consumeActionRateLimit(SCOPE, session.userId, request, { maxAttempts: 60, windowSeconds: 60 * 60 });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  try {
    const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!payload) throw new Error("Data pembaruan tidak valid.");
    const requestHash = hashRequestPayload({ requestId: id, ...payload });
    const existing = await getIdempotentResponse(request, SCOPE, session.userId, requestHash);
    if (existing) return Response.json(existing.body, { status: existing.statusCode });
    await updateStaffRequest(id, payload, session, auditContextFromRequest(request));
    const body = { ok: true };
    await saveIdempotentResponse(request, SCOPE, session.userId, requestHash, body, 200);
    return Response.json(body);
  } catch (error) {
    const status = error instanceof IdempotencyConflictError ? 409 : 400;
    return Response.json({ message: error instanceof Error ? error.message : "Pembaruan gagal." }, { status });
  }
}
