import { createContentSubmission, getCurrentCitizen, listCitizenSubmissions } from "@/lib/portal";
import { enforceRateLimit, RateLimitError, rateLimitResponse } from "@/lib/rate-limit";
import { sameOriginErrorResponse } from "@/lib/request-security";

export async function GET() {
  const citizen = await getCurrentCitizen();
  if (!citizen) return Response.json({ message: "Tidak terautentikasi." }, { status: 401 });
  return Response.json({ submissions: await listCitizenSubmissions(citizen.id) });
}

export async function POST(request: Request) {
  const originError = sameOriginErrorResponse(request);
  if (originError) return originError;
  const citizen = await getCurrentCitizen();
  if (!citizen) return Response.json({ message: "Tidak terautentikasi." }, { status: 401 });
  try {
    await enforceRateLimit({
      scope: "citizen-content-submission",
      identifier: citizen.id,
      limit: 10,
      windowSeconds: 24 * 60 * 60,
    });
    const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!payload) throw new Error("Data kontribusi tidak valid.");
    const result = await createContentSubmission(citizen.id, payload);
    return Response.json({ result }, { status: 201 });
  } catch (error) {
    if (error instanceof RateLimitError) return rateLimitResponse(error);
    return Response.json({ message: error instanceof Error ? error.message : "Kontribusi gagal dikirim." }, { status: 400 });
  }
}
