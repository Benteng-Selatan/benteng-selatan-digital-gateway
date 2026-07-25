import { createServiceRequest, getCurrentCitizen, listCitizenRequests } from "@/lib/portal";
import { enforceRateLimit, RateLimitError, rateLimitResponse } from "@/lib/rate-limit";
import { sameOriginErrorResponse } from "@/lib/request-security";

export async function GET() {
  const citizen = await getCurrentCitizen();
  if (!citizen) return Response.json({ message: "Tidak terautentikasi." }, { status: 401 });
  return Response.json({ requests: await listCitizenRequests(citizen.id) });
}

export async function POST(request: Request) {
  const originError = sameOriginErrorResponse(request);
  if (originError) return originError;
  const citizen = await getCurrentCitizen();
  if (!citizen) return Response.json({ message: "Tidak terautentikasi." }, { status: 401 });
  try {
    await enforceRateLimit({
      scope: "citizen-service-request",
      identifier: citizen.id,
      limit: 5,
      windowSeconds: 24 * 60 * 60,
    });
    const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!payload) throw new Error("Data pengajuan tidak valid.");
    const result = await createServiceRequest(citizen.id, payload);
    return Response.json({ result }, { status: 201 });
  } catch (error) {
    if (error instanceof RateLimitError) return rateLimitResponse(error);
    return Response.json({ message: error instanceof Error ? error.message : "Pengajuan gagal." }, { status: 400 });
  }
}
