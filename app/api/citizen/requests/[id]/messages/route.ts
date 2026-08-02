import {
  consumeActionRateLimit,
  getIdempotentResponse,
  hashRequestPayload,
  IdempotencyConflictError,
  rateLimitResponse,
  saveIdempotentResponse,
} from "@/lib/action-guard";
import { auditContextFromRequest } from "@/lib/audit";
import { addCitizenMessage, getCurrentCitizen } from "@/lib/portal";

const SCOPE = "citizen.request.message";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const citizen = await getCurrentCitizen();
  if (!citizen) return Response.json({ message: "Tidak terautentikasi." }, { status: 401 });
  const { id } = await params;

  const rateLimit = await consumeActionRateLimit(SCOPE, citizen.id, request, {
    maxAttempts: 30,
    windowSeconds: 60 * 60,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  try {
    const payload = await request.json().catch(() => null) as { message?: string } | null;
    if (!payload) throw new Error("Data pesan tidak valid.");
    const requestHash = hashRequestPayload({ requestId: id, ...payload });
    const existing = await getIdempotentResponse(request, SCOPE, citizen.id, requestHash);
    if (existing) return Response.json(existing.body, { status: existing.statusCode });

    await addCitizenMessage(citizen.id, id, payload.message, auditContextFromRequest(request));
    const body = { ok: true };
    await saveIdempotentResponse(request, SCOPE, citizen.id, requestHash, body, 200);
    return Response.json(body);
  } catch (error) {
    const status = error instanceof IdempotencyConflictError ? 409 : 400;
    return Response.json({ message: error instanceof Error ? error.message : "Pesan gagal dikirim." }, { status });
  }
}
