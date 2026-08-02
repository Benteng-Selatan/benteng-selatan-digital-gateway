import {
  consumeActionRateLimit,
  getIdempotentResponse,
  hashRequestPayload,
  IdempotencyConflictError,
  rateLimitResponse,
  saveIdempotentResponse,
} from "@/lib/action-guard";
import { auditContextFromRequest } from "@/lib/audit";
import { createContentSubmission, getCurrentCitizen, listCitizenSubmissions } from "@/lib/portal";

const SCOPE = "citizen.submission.create";

export async function GET() {
  const citizen = await getCurrentCitizen();
  if (!citizen) return Response.json({ message: "Tidak terautentikasi." }, { status: 401 });
  return Response.json({ submissions: await listCitizenSubmissions(citizen.id) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const citizen = await getCurrentCitizen();
  if (!citizen) return Response.json({ message: "Tidak terautentikasi." }, { status: 401 });

  const rateLimit = await consumeActionRateLimit(SCOPE, citizen.id, request, {
    maxAttempts: 10,
    windowSeconds: 24 * 60 * 60,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  try {
    const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!payload) throw new Error("Data kontribusi tidak valid.");
    const requestHash = hashRequestPayload(payload);
    const existing = await getIdempotentResponse(request, SCOPE, citizen.id, requestHash);
    if (existing) return Response.json(existing.body, { status: existing.statusCode });

    const result = await createContentSubmission(citizen.id, payload, auditContextFromRequest(request));
    const body = { result };
    await saveIdempotentResponse(request, SCOPE, citizen.id, requestHash, body, 201);
    return Response.json(body, { status: 201 });
  } catch (error) {
    const status = error instanceof IdempotencyConflictError ? 409 : 400;
    return Response.json({ message: error instanceof Error ? error.message : "Kontribusi gagal dikirim." }, { status });
  }
}
