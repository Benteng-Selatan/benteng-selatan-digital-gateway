import { cookies } from "next/headers";
import { CITIZEN_SESSION_COOKIE, citizenSessionCookieOptions, createCitizenSessionToken } from "@/lib/citizen-auth";
import { registerCitizen } from "@/lib/portal";
import { clientAddress, enforceRateLimit, RateLimitError, rateLimitResponse } from "@/lib/rate-limit";
import { sameOriginErrorResponse } from "@/lib/request-security";

export async function POST(request: Request) {
  const originError = sameOriginErrorResponse(request);
  if (originError) return originError;
  try {
    await enforceRateLimit({
      scope: "citizen-register",
      identifier: clientAddress(request),
      limit: 5,
      windowSeconds: 60 * 60,
    });

    const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!payload) return Response.json({ message: "Data pendaftaran tidak valid." }, { status: 400 });
    const user = await registerCitizen(payload);
    const store = await cookies();
    store.set(CITIZEN_SESSION_COOKIE, createCitizenSessionToken(user.id, user.email), citizenSessionCookieOptions);
    return Response.json({ ok: true, user }, { status: 201 });
  } catch (error) {
    if (error instanceof RateLimitError) return rateLimitResponse(error);
    return Response.json({ message: error instanceof Error ? error.message : "Pendaftaran gagal." }, { status: 400 });
  }
}
