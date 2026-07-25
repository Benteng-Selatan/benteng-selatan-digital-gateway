import { addCitizenMessage, getCurrentCitizen } from "@/lib/portal";
import { enforceRateLimit, RateLimitError, rateLimitResponse } from "@/lib/rate-limit";
import { sameOriginErrorResponse } from "@/lib/request-security";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const originError = sameOriginErrorResponse(request);
  if (originError) return originError;
  const citizen = await getCurrentCitizen();
  if (!citizen) return Response.json({ message: "Tidak terautentikasi." }, { status: 401 });
  try {
    await enforceRateLimit({
      scope: "citizen-message",
      identifier: citizen.id,
      limit: 30,
      windowSeconds: 10 * 60,
    });
    const payload = await request.json().catch(() => null) as { message?: string } | null;
    const { id } = await params;
    await addCitizenMessage(citizen.id, id, payload?.message);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof RateLimitError) return rateLimitResponse(error);
    return Response.json({ message: error instanceof Error ? error.message : "Pesan gagal dikirim." }, { status: 400 });
  }
}
