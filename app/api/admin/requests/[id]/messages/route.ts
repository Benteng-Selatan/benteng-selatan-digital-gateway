import {
  consumeActionRateLimit,
  getIdempotentResponse,
  hashRequestPayload,
  IdempotencyConflictError,
  rateLimitResponse,
  saveIdempotentResponse,
} from "@/lib/action-guard";
import { requireAdminPermission } from "@/lib/auth";
import { auditContextFromRequest } from "@/lib/audit";
import { addStaffMessage } from "@/lib/portal";

const SCOPE = "admin.request.message";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminPermission("requests:message");
  if (!session) return Response.json({ message: "Akses ditolak." }, { status: 403 });
  const { id } = await params;

  const rateLimit = await consumeActionRateLimit(SCOPE, session.userId, request, {
    maxAttempts: 60,
    windowSeconds: 60 * 60,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  try {
    const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!payload) throw new Error("Data pesan tidak valid.");
    const requestHash = hashRequestPayload({ requestId: id, ...payload });
    const existing = await getIdempotentResponse(request, SCOPE, session.userId, requestHash);
    if (existing) return Response.json(existing.body, { status: existing.statusCode });

    await addStaffMessage(id, payload, session, auditContextFromRequest(request));
    const body = { ok: true };
    await saveIdempotentResponse(request, SCOPE, session.userId, requestHash, body, 200);
    return Response.json(body);
  } catch (error) {
    const status = error instanceof IdempotencyConflictError ? 409 : 400;
    return Response.json({ message: error instanceof Error ? error.message : "Pesan gagal dikirim." }, { status });
  }
}
