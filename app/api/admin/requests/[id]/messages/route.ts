import { isAuthenticated } from "@/lib/auth";
import { addStaffMessage } from "@/lib/portal";
import { clientAddress, enforceRateLimit, RateLimitError, rateLimitResponse } from "@/lib/rate-limit";
import { sameOriginErrorResponse } from "@/lib/request-security";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const originError = sameOriginErrorResponse(request);
  if (originError) return originError;
  if (!(await isAuthenticated())) return Response.json({ message: "Tidak terautentikasi." }, { status: 401 });
  try {
    await enforceRateLimit({
      scope: "staff-message",
      identifier: clientAddress(request),
      limit: 60,
      windowSeconds: 10 * 60,
    });
    const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!payload) throw new Error("Data pesan tidak valid.");
    const { id } = await params;
    await addStaffMessage(id, payload, process.env.CMS_USERNAME || "Petugas Kelurahan");
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof RateLimitError) return rateLimitResponse(error);
    return Response.json({ message: error instanceof Error ? error.message : "Pesan gagal dikirim." }, { status: 400 });
  }
}
